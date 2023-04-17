import { Router } from "express";
import { sample_foods, sample_tags } from "../data";
import { db } from "../server";
import { HTTP_BAD_REQUEST } from "../constants/http_status";

const router = Router();

router.get("/get/categories", (req, res) => {
    db.query("SELECT * FROM novel_categories", function(error, results, fields) {
        if(error) throw error;
        res.send(results);
    });
});

router.get("/get/allNovels", (req, res) => {
  db.query("SELECT * FROM novels", function(error, results, fields) {
      if(error) throw error;
      res.send(results);
  });
});

router.get("/get/chapters", (req, res) => {
  db.query("SELECT * FROM chapters", function(error, results, fields) {
      if(error) throw error;
      res.send(results);
  });
});

router.get("/get/volumes", (req, res) => {
  db.query("SELECT * FROM volumes", function(error, results, fields) {
      if(error) throw error;
      res.send(results);
  });
});

router.get("/search/:searchTerm", (req, res) => {
  db.query(`SELECT * FROM novels`, function(error, results, fields) {
      if(error) throw error;
      res.send(results);
  });
})

router.get("/get/novels", (req, res) => {
    db.query(`SELECT 
    novels.novel_id, 
    GROUP_CONCAT(DISTINCT novel_categories.category_name SEPARATOR ', ') AS categories,
    novels.title, 
    novels.author, 
    novels.artist, 
    novels.description,
    novels.cover_image
    FROM novels
    INNER JOIN novel_genre ON novels.novel_id = novel_genre.novel_id
    INNER JOIN novel_categories ON novel_categories.category_id = novel_genre.category_id
    GROUP BY novels.novel_id`, function(error, results, fields) {
        if(error) throw error;
        res.send(results);
    });
});

router.get('/get/novels/:genre', (req, res) => {
    const genre = req.params.genre;
    const sql = `SELECT novels.novel_id, novel_categories.category_id, category_name, title, author, artist, cover_image
                FROM novels
                INNER JOIN novel_genre ON novels.novel_id = novel_genre.novel_id
                INNER JOIN novel_categories ON novel_categories.category_id = novel_genre.category_id
                WHERE novel_categories.category_name = ?`;
  
    db.query(sql, [genre], (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/chapter/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM chapters
                WHERE chapter_id = ?`;
  
    db.query(sql, [id], (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/novel/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM novels
                WHERE novel_id = ?`;
  
    db.query(sql, [id], (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/novel/tag/:id', (req, res) => {
    const id = req.params.id;
    const sql = `select novel_categories.category_id, category_name 
                from novel_categories inner join novel_genre on novel_categories.category_id = novel_genre.category_id 
                where novel_id = ?`;
  
    db.query(sql, [id], (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/novel/volumes/:id', (req, res) => {
    const id = req.params.id;
    const sql = `select volumes.volume_id, volumes.volume_title, cover_image, chapter_id, chapters.title, chapters.updated_at 
                from volumes inner join chapters on volumes.volume_id = chapters.chapter_id 
                where novel_id = ?`;
  
    db.query(sql, [id], (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/novel/chapters', (req, res) => {
    // const id = req.params.id;
    const sql = `select * from chapters`;
  
    db.query(sql, (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

router.post('/post/favorites', (
  (req, res) => {
   const {user_id, novel_id} = req.body;
   const query = `SELECT * FROM favorites WHERE novel_id = ? and user_id = ?`;
   const values = [user_id, novel_id];

   db.query(query, values, async (error, results) => {
     if (error) {
       console.log(error);
       res.status(500).send("Internal Server Error");
     } else if (results.length > 0) {
       res.status(HTTP_BAD_REQUEST).send("Truyện đã được theo dõi!");
     } else {
       const query = 'INSERT INTO favorites (user_id, novel_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
       const values = [user_id, novel_id];

       db.query(query, values, async (error, results) => {
         if (error) {
           console.log(error);
           res.status(500).send("Internal Server Error");
         } else {
           const dbFavorites = {
             id: results.insertId,
             user_id,
             novel_id,
           };
         }
       });
     }
   });
 }
));


/* api router Admin */

router.post('/post/newNovel', (req, res) => {
  const { title, author, artist, description, cover_image, categories_id } = req.body;

  if (!categories_id || categories_id.length === 0) {
    return res.status(400).send('At least one category must be specified');
  }

  db.query(`INSERT INTO novels (title, author, artist, description, cover_image, created_at, updated_at) 
    VALUES ('${title}', '${author}', '${artist}', '${description}', '${cover_image}', NOW(), NOW())`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      const novel_id = result.insertId;
      for (const category_id of categories_id) {
        db.query(`INSERT INTO novel_genre (novel_id, category_id) VALUES ('${novel_id}', '${category_id}')`, (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
          } else {
            console.log(`Inserted ${result.affectedRows} row(s) into novel_genre.`);
          }
        });
      }
      res.status(200).json({ ok: true });
    }
  });
});

router.put('/put/novel/:novelId', (req, res) => {
  const { novelId } = req.params;
  const { title, author, artist, description, cover_image, categories_id } = req.body;

  if (!categories_id || categories_id.length === 0) {
    return res.status(400).send('At least one category must be specified');
  }

  db.query(`UPDATE novels SET title = '${title}', author = '${author}', artist = '${artist}', description = '${description}', cover_image = '${cover_image}', updated_at = NOW() WHERE novel_id = '${novelId}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      db.query(`DELETE FROM novel_genre WHERE novel_id = '${novelId}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        } else {
          for (const category_id of categories_id) {
            db.query(`INSERT INTO novel_genre (novel_id, category_id) VALUES ('${novelId}', '${category_id}')`, (err, result) => {
              if (err) {
                console.log(err);
                res.status(500).send('Internal server error');
              } else {
                console.log(`Inserted ${result.affectedRows} row(s) into novel_genre.`);
              }
            });
          }
          res.status(200).json({ ok: true });
        }
      });
    }
  });
});

router.get('/get/novelById/:id', (req, res) => {
  const id = req.params.id;

  db.query(`SELECT novels.*, GROUP_CONCAT(novel_genre.category_id) AS categories_id 
            FROM novels 
            LEFT JOIN novel_genre ON novels.novel_id = novel_genre.novel_id 
            WHERE novels.novel_id = ${id}
            GROUP BY novels.novel_id`, (err, novelsResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else if (novelsResult.length === 0) {
      res.status(404).send('Novel not found');
    } else {
      const novel = {
        title: novelsResult[0].title,
        author: novelsResult[0].author,
        artist: novelsResult[0].artist,
        description: novelsResult[0].description,
        cover_image: novelsResult[0].cover_image,
        categories_id: novelsResult[0].categories_id ? novelsResult[0].categories_id.split(',').map((id: any) => parseInt(id.trim())) : [],
        created_at: novelsResult[0].created_at,
        updated_at: novelsResult[0].updated_at,
      };

      res.send(novel);
    }
  });
});

router.delete('/delete/novel/:novelId', (req, res) => {
  const { novelId } = req.params;

  db.query(`DELETE FROM novel_genre WHERE novel_id = '${novelId}'`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      db.query(`DELETE FROM novels WHERE novel_id = '${novelId}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        } else if (result.affectedRows === 0) {
          res.status(404).send('Novel not found');
        } else {
          console.log(`Deleted ${result.affectedRows} row(s) from novels.`);
          res.status(200).json({ ok: true });
          
        }
      });
    }
  });
});

router.get('/get/novelWithGenre/:id', (req, res) => {
  const id = req.params.id;

  db.query(`SELECT novels.*, GROUP_CONCAT(novel_genre.category_id) AS categories_id 
            FROM novels 
            LEFT JOIN novel_genre ON novels.novel_id = novel_genre.novel_id 
            WHERE novels.novel_id = ${id}
            GROUP BY novels.novel_id`, (err, novelsResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else if (novelsResult.length === 0) {
      res.status(404).send('Novel not found');
    } else {
      const novel = {
        novel_id: novelsResult[0].novel_id,
        title: novelsResult[0].title,
        author: novelsResult[0].author,
        artist: novelsResult[0].artist,
        description: novelsResult[0].description,
        cover_image: novelsResult[0].cover_image,
        categories_id: novelsResult[0].categories_id ? novelsResult[0].categories_id.split(',').map((id: any) => parseInt(id.trim())) : []
      };

      db.query(`SELECT * FROM novel_categories`, (err, categoriesResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        } else {
          const categoriesMap = new Map();
          categoriesResult.forEach((category: any) => {
            categoriesMap.set(category.category_id, category.category_name);
          });

          const categories = novel.categories_id.map((id: any) => categoriesMap.get(id));
          novel.categories_id = categories;

          res.send(novel);
        }
      });
    }
  });
});

router.post('/post/newGenre', (req, res) => {
  const {category_name, description } = req.body;

  const query = 'INSERT INTO novel_categories (category_name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
  const values = [category_name, description];

  db.query(query, values, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.get('/get/genreById/:id', (req, res) => {
  const category_id = req.params.id;

  db.query(`SELECT * FROM novel_categories WHERE category_id = ?`, [category_id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else if (result.length === 0) {
      res.status(404).send('Category not found');
    } else {
      res.send(result[0]);
    }
  });
});

router.put('/put/genre/:id', (req, res) => {
  const categoryId = req.params.id;
  const { category_name, description } = req.body;

  const query = 'UPDATE novel_categories SET category_name = ?, description = ?, updated_at = NOW() WHERE category_id = ?';
  const values = [category_name, description, categoryId];

  db.query(query, values, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else if (results.affectedRows === 0) {
      res.status(404).send('Category not found');
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.delete('/delete/genre/:id', (req, res) => {
  const category_id = req.params.id;
  const deleteGenreQuery = 'DELETE FROM novel_genre WHERE category_id = ?';
  const deleteCategoryQuery = 'DELETE FROM novel_categories WHERE category_id = ?';

  db.query(deleteGenreQuery, category_id, (err, genreResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      db.query(deleteCategoryQuery, category_id, (err, categoryResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        } else {
          res.status(200).json({ ok: true });
        }
      });
    }
  });
});

router.post('/post/newVolume', (req, res) => {
  const { volume_title, cover_image, novel_id } = req.body;

  const query = 'INSERT INTO volumes (volume_title, cover_image, novel_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
  const values = [volume_title, cover_image, novel_id];

  db.query(query, values, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

// router.get('/get/novelById/:id', (req, res) => {
//   const id = req.params.id;

//   db.query(`SELECT novels.*, GROUP_CONCAT(novel_genre.category_id) AS categories_id 
//             FROM novels 
//             LEFT JOIN novel_genre ON novels.novel_id = novel_genre.novel_id 
//             WHERE novels.novel_id = ${id}
//             GROUP BY novels.novel_id`, (err, novelsResult) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send('Internal server error');
//     } else if (novelsResult.length === 0) {
//       res.status(404).send('Novel not found');
//     } else {
//       const novel = {
//         id: novelsResult[0].id,
//         title: novelsResult[0].title,
//         author: novelsResult[0].author,
//         artist: novelsResult[0].artist,
//         description: novelsResult[0].description,
//         cover_image: novelsResult[0].cover_image,
//         categories_id: novelsResult[0].categories_id ? novelsResult[0].categories_id.split(',').map((id: any) => parseInt(id.trim())) : []
//       };

//       db.query(`SELECT * FROM novel_categories`, (err, categoriesResult) => {
//         if (err) {
//           console.log(err);
//           res.status(500).send('Internal server error');
//         } else {
//           const categories = categoriesResult.map((category: any) => {
//             return {
//               id: category.category_id,
//               name: category.category_name
//             }
//           });

//           res.send({
//             novel: novel,
//             categories: categories
//           });
//         }
//       });
//     }
//   });
// });

// router.post('/post/newNovel', (req, res) => {
//   const { title, author, artist, description, cover_image, categories_id } = req.body;

//   db.query(`INSERT INTO novels (title, author, artist, description, cover_image, created_at, updated_at) 
//     VALUES ('${title}', '${author}', '${artist}', '${description}', '${cover_image}', NOW(), NOW())`, (err, result) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send('Internal server error');
//     } else {
//       const novel_id = result.insertId;
//       for (const category_id of categories_id) {
//         db.query(`INSERT INTO novel_genre (novel_id, category_id) VALUES ('${novel_id}', '${category_id}')`, (err, result) => {
//           if (err) {
//             console.log(err);
//             res.status(500).send('Internal server error');
//           } else {
//             console.log(`Inserted ${result.affectedRows} row(s) into novel_genre.`);
//           }
//         });
//       }
//       res.send('Novel created successfully');
//     }
//   });
// });

router.post('/post/newCategory', (req, res) => {
  const { category_name } = req.body;

  db.query(`INSERT INTO novel_categories (category_name, created_at, updated_at) VALUES ('${category_name}', NOW(), NOW())`, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      console.log(`Inserted ${result.affectedRows} row(s) into novel_categories.`);
      res.send('Category created successfully');
    }
  });
});

export default router;
