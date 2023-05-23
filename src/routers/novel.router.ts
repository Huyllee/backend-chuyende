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
    const sql = `select * from chapters`;
  
    db.query(sql, (error, results, fields) => {
      if (error) throw error;
      res.send(results);
    });
  });

  router.get('/get/audio/:id', (req, res) => {
    const chapterId = req.params.id;
  
    db.query(`SELECT *
              FROM audio
              WHERE chapter_id = ${chapterId}`, (err, audioResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
      } else if (audioResult.length === 0) {
        return res.status(404).send('Audio not found');
      } else {
        const audio = audioResult.map((audio: any) => {
          return {
            audio_id: audio.audio_id,
            chapter_id: audio.chapter_id,
            title: audio.title,
            url: audio.url,
            created_at: audio.created_at,
            updated_at: audio.updated_at,
          }
        });
  
        res.send(audio);
      }
    });
  });

router.post('/post/favorites', (
  (req, res) => {
   const {user_id, novel_id} = req.body;
   const novelId = novel_id;
   const query = `SELECT * FROM favorites WHERE novel_id = ? and user_id = ?`;
   const values = [novelId, user_id];

   db.query(query, values, async (error, results) => {
     if (error) {
       console.log(error);
       return res.status(500).send("Internal Server Error");
     } else if (results.length > 0) {
       res.json({ ok: false });
      //  res.status(HTTP_BAD_REQUEST).send("Truyện đã được theo dõi!");
     } else {
       const query = 'INSERT INTO favorites (user_id, novel_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
       const values = [user_id, novel_id];

       db.query(query, values, async (error, results) => {
         if (error) {
           console.log(error);
           return res.status(500).send("Internal Server Error");
         } else {
           const dbFavorites = {
             id: results.insertId,
             user_id,
             novel_id,
           };
           res.status(200).json({ ok: true });
         }
       });
     }
   });
 }
));

router.delete('/delete/favorite/:favoriteId', (req, res) => {
  const favoriteId = req.params.favoriteId;

  const query = 'DELETE FROM favorites WHERE favorite_id = ?';
  const values = [favoriteId];

  db.query(query, values, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Internal Server Error");
    } else if (results.affectedRows === 0) {
      return res.status(404).send("Favorite not found");
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.post('/post/rating', (
  (req, res) => {
   const {user_id, novel_id, rating_value} = req.body;
   const query = `SELECT * FROM ratings WHERE user_id = ? AND novel_id = ?`;
   const values = [user_id, novel_id];

   db.query(query, values, async (error, results) => {
     if (error) {
       console.log(error);
       return res.status(500).send("Internal Server Error");
     } else if (results.length > 0) {
       res.json({ ok: false });
      //  res.status(HTTP_BAD_REQUEST).send("Truyện đã được theo dõi!");
     } else {
       const query = 'INSERT INTO ratings (user_id, novel_id, rating_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
       const values = [user_id, novel_id, rating_value];

       db.query(query, values, async (error, results) => {
         if (error) {
           console.log(error);
           return res.status(500).send("Internal Server Error");
         } else {
           const dbRatings = {
             id: results.insertId,
             user_id,
             novel_id,
           };
           res.status(200).json({ ok: true });
         }
       });
     }
   });
 }
));

router.get('/get/allRatings', function(req, res) {
  db.query(`SELECT * FROM ratings`, function(error, results, fields) {
    if (error) throw error;
    res.send(results);
  });
});

router.get('/get/ratings/:novelId/:userId', (req, res) => {
  const novelId = req.params.novelId;
  const userId = req.params.userId;
  
  const query = 'SELECT * FROM ratings WHERE novel_id = ? AND user_id = ?';
  const values = [novelId, userId];

  db.query(query, values, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Internal Server Error');
    } else {
      res.json(results);
    }
  });
});

router.put('/update/ratings/:novelId/:userId', (req, res) => {
  const { novelId, userId } = req.params;
  const { RatingObj } = req.body;

  const query = `UPDATE ratings SET rating_value = ${RatingObj}, novel_id = ${novelId}, user_id = ${userId}, updated_at = NOW() WHERE novel_id = ${novelId} AND user_id = ${userId}`;

  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (results.affectedRows === 0) {
      return res.status(404).send('Rating not found');
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.get('/get/favorites/:id', (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM favorites
              WHERE novel_id = ?`;

  db.query(sql, [id], (error, results, fields) => {
    if (error) throw error;
    res.send(results);
  });
});

router.get('/get/favoriteById/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `SELECT * FROM novels LEFT JOIN favorites ON novels.novel_id = favorites.novel_id WHERE favorites.user_id = ?`;

  db.query(query, userId, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else {
      res.send(results);
    }
  });
});

router.get('/get/newChapters', (req, res) => {
  const sql = `SELECT c.* , v.volume_title, n.novel_id, n.title as novel_title, n.cover_image
              FROM chapters AS c 
              INNER JOIN volumes AS v ON c.volume_id = v.volume_id 
              INNER JOIN novels AS n ON n.novel_id = v.novel_id
              INNER JOIN (
                SELECT MAX(c2.updated_at) as max_date, v2.novel_id
                FROM chapters AS c2
                INNER JOIN volumes AS v2 ON c2.volume_id = v2.volume_id
                GROUP BY v2.novel_id
              ) as m ON v.novel_id = m.novel_id AND c.updated_at = m.max_date
              ORDER BY c.updated_at DESC`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

router.get('/get/novelByTag/:tag', (req, res) => {
  const { tag } = req.params;
  const sql = `SELECT c.* , v.volume_title, n.novel_id, n.title as novel_title, n.cover_image
                FROM chapters AS c 
                INNER JOIN volumes AS v ON c.volume_id = v.volume_id 
                INNER JOIN novels AS n ON n.novel_id = v.novel_id
                INNER JOIN (
                    SELECT MAX(c2.updated_at) as max_date, v2.novel_id
                    FROM chapters AS c2
                    INNER JOIN volumes AS v2 ON c2.volume_id = v2.volume_id
                    GROUP BY v2.novel_id
                ) as m ON v.novel_id = m.novel_id AND c.updated_at = m.max_date
                INNER JOIN novel_genre AS ng ON ng.novel_id = n.novel_id
                INNER JOIN novel_categories AS nc ON nc.category_id = ng.category_id AND nc.category_name = ?
                ORDER BY c.updated_at DESC`;
  db.query(sql, tag, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else {
      res.send(results);
    }
  });
});

router.get('/get/topRatings', function(req, res) {
  db.query(`SELECT n.novel_id, n.title, n.cover_image, IFNULL(AVG(r.rating_value), 0) AS avg_rating
            FROM novels AS n
            LEFT JOIN ratings AS r ON n.novel_id = r.novel_id
            GROUP BY n.novel_id`, function(error, results, fields) {
    if (error) throw error;
    res.send(results);
  });
});


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
      return res.status(500).send('Internal server error');
    } else {
      const novel_id = result.insertId;
      for (const category_id of categories_id) {
        db.query(`INSERT INTO novel_genre (novel_id, category_id) VALUES ('${novel_id}', '${category_id}')`, (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
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
      return res.status(500).send('Internal server error');
    } else {
      db.query(`DELETE FROM novel_genre WHERE novel_id = '${novelId}'`, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal server error');
        } else {
          for (const category_id of categories_id) {
            db.query(`INSERT INTO novel_genre (novel_id, category_id) VALUES ('${novelId}', '${category_id}')`, (err, result) => {
              if (err) {
                console.log(err);
                return res.status(500).send('Internal server error');
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
      return res.status(500).send('Internal server error');
    } else if (novelsResult.length === 0) {
      return res.status(404).send('Novel not found');
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

  db.query(`DELETE FROM volumes WHERE novel_id = '${novelId}'`, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else
      db.query(`DELETE FROM novel_genre WHERE novel_id = '${novelId}'`, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        } else {
          db.query(`DELETE FROM novels WHERE novel_id = '${novelId}'`, (err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).send('Internal server error');
            } else if (result.affectedRows === 0) {
              return res.status(404).send('Novel not found');
            } else {
              console.log(`Deleted ${result.affectedRows} row(s) from novels.`);
              res.status(200).json({ ok: true });
              
            }
          });
        }
      });
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
      return res.status(500).send('Internal server error');
    } else if (novelsResult.length === 0) {
      return res.status(404).send('Novel not found');
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
          return res.status(500).send('Internal server error');
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
      return res.status(500).send('Internal Server Error');
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
      return res.status(500).send('Internal server error');
    } else if (result.length === 0) {
      return res.status(404).send('Category not found');
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
      return res.status(500).send('Internal server error');
    } else if (results.affectedRows === 0) {
      return res.status(404).send('Category not found');
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
      return res.status(500).send('Internal server error');
    } else {
      db.query(deleteCategoryQuery, category_id, (err, categoryResult) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal server error');
        } else {
          res.status(200).json({ ok: true });
        }
      });
    }
  });
});

router.post('/post/newVolume', (req, res) => {
  const { volume_title, cover_image, novels } = req.body;

  const query = 'INSERT INTO volumes (volume_title, cover_image, novel_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
  const values = [volume_title, cover_image, novels];

  db.query(query, values, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.get('/get/volumeById/:id', (req, res) => {
  const volumeId = req.params.id;

  db.query(`SELECT volumes.volume_id, volumes.volume_title, volumes.cover_image, 
                   novels.title AS novels, volumes.created_at, volumes.updated_at
            FROM volumes 
            INNER JOIN novels ON volumes.novel_id = novels.novel_id
            WHERE volumes.volume_id = ${volumeId}`, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (result.length === 0) {
      return res.status(404).send('Volume not found');
    } else {
      const volume = {
        volume_id: result[0].volume_id,
        volume_title: result[0].volume_title,
        cover_image: result[0].cover_image,
        novels: result[0].novels,
        created_at: result[0].created_at,
        updated_at: result[0].updated_at,
      };

      res.send(volume);
    }
  });
});

router.put('/put/volume/:id', (req, res) => {
  const volumeId = req.params.id;

  // Lấy dữ liệu mới từ client
  const { volume_title, cover_image, novels, } = req.body;

  db.query(
    `UPDATE volumes 
     SET volume_title = ?, cover_image = ?, novel_id = ?, updated_at = NOW()
     WHERE volume_id = ?`,
    [volume_title, cover_image, novels, volumeId],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
      } else if (result.affectedRows === 0) {
        return res.status(404).send('Volume not found');
      } else {
        res.status(200).json({ ok: true });
      }
    }
  );
});

router.get('/get/chaptersByVolumeId/:id', (req, res) => {
  const volumeId = req.params.id;

  db.query(`SELECT *
            FROM chapters 
            WHERE volume_id = ${volumeId}`, (err, chaptersResult) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (chaptersResult.length === 0) {
      return res.status(404).send('Chapters not found');
    } else {
      const chapters = chaptersResult.map((chapter: any) => {
        return {
          chapter_id: chapter.chapter_id,
          title: chapter.title,
          volume_id: chapter.volume_id,
          content: chapter.content,
          created_id: chapter.created_id,
          updated_id: chapter.updated_id,
        }
      });

      res.send(chapters);
    }
  });
});

router.delete('/delete/volume/:id', (req, res) => {
  const volumeId = req.params.id;

  // Xóa các bản ghi trong bảng chapters có volume_id tương ứng
  db.query(`DELETE FROM chapters WHERE volume_id = ${volumeId}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else {
      // Xóa volume có id tương ứng
      db.query(`DELETE FROM volumes WHERE volume_id = ${volumeId}`, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal server error');
        } else {
          res.status(200).json({ ok: true });
        }
      });
    }
  });
});

router.get('/get/chapterById/:id', (req, res) => {
  const chapterId = req.params.id;

  db.query(`SELECT chapters.chapter_id, chapters.title, chapters.content, chapters.volume_id, volumes.volume_title, audio.url
            FROM chapters 
            JOIN volumes ON chapters.volume_id = volumes.volume_id
            JOIN audio ON chapters.chapter_id = audio.chapter_id
            WHERE chapters.chapter_id = ${chapterId}`, (err, chapterResult) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (chapterResult.length === 0) {
      return res.status(404).send('Chapter not found');
    } else {
      const chapter = {
        chapter_id: chapterResult[0].chapter_id,
        title: chapterResult[0].title,
        content: chapterResult[0].content,
        volume_title: chapterResult[0].volume_title,
        volume: chapterResult[0].volume_id,
        audio: chapterResult[0].url,
      };

      res.send(chapter);
    }
  });
});

router.post('/post/newChapter', (req, res) => {
  const { title, content, volume, audio } = req.body;

  db.query(`SELECT * FROM volumes WHERE volume_id = ${volume}`, (volumeErr, volumeResult) => {
    if (volumeErr) {
      console.log(volumeErr);
      return res.status(500).send('Internal server error');
    } else if (volumeResult.length === 0) {
      return res.status(404).send('Volume not found');
    } else {
      db.query(`INSERT INTO chapters (title, content, volume_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`, [title, content, volume], (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal server error');
        } else {
          const chapter_id = result.insertId;
          db.query(`INSERT INTO audio (chapter_id, title, url, created_at, updated_at) VALUES ('${chapter_id}', '${title}', '${audio}', NOW(), NOW())`, (err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).send('Internal server error');
            } else {
              console.log(`Inserted ${result.affectedRows} row(s) into audio.`);
            }
          });
        res.status(200).json({ ok: true });
    }
      });
    }
  });
});

// router.post('/post/newChapter', (req, res) => {
//   const { title, content, volume } = req.body;

//   db.query(`SELECT * FROM volumes WHERE volume_id = ${volume}`, (volumeErr, volumeResult) => {
//     if (volumeErr) {
//       console.log(volumeErr);
//       return res.status(500).send('Internal server error');
//     } else if (volumeResult.length === 0) {
//       return res.status(404).send('Volume not found');
//     } else {
//       db.query(`INSERT INTO chapters (title, content, volume_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`, [title, content, volume], (err, result) => {
//         if (err) {
//           console.log(err);
//           return res.status(500).send('Internal server error');
//         } else {
//           const newChapter = {
//             chapter_id: result.insertId,
//             title: title,
//             content: content,
//             volume: volume
//           };
//           res.status(200).json({ ok: true });
//         }
//       });
//     }
//   });
// });

router.put('/put/chapter/:id', (req, res) => {
  const chapterId = req.params.id;

  // Lấy dữ liệu mới từ client
  const { volume, title, content, audio } = req.body;

  db.query(
    `UPDATE chapters 
     SET volume_id = ?, title = ?, content = ?, updated_at = NOW()
     WHERE chapter_id = ?`,
    [volume, title, content, chapterId],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
      } else if (result.affectedRows === 0) {
        return res.status(404).send('Chapter not found');
      } else {
        db.query(
          `UPDATE audio 
           SET title = ?, url = ?, updated_at = NOW()
           WHERE chapter_id = ?`,
          [title, audio, chapterId],
          (audioErr, audioResult) => {
            if (audioErr) {
              console.log(audioErr);
              return res.status(500).send('Internal server error');
            } else {
              console.log(`Updated ${audioResult.affectedRows} row(s) in audio.`);
              res.status(200).json({ ok: true });
            }
          }
        );
      }
    }
  );
});

router.delete('/delete/chapter/:id', (req, res) => {
  const chapterId = req.params.id;

  // Delete all audios with corresponding chapter_id first
  db.query(`DELETE FROM audio WHERE chapter_id = ${chapterId}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else {
      // If audios are deleted successfully, delete the chapter
      db.query(`DELETE FROM chapters WHERE chapter_id = ${chapterId}`, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Internal server error');
        } else {
          res.status(200).json({ ok: true });
        }
      });
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
      return res.status(500).send('Internal server error');
    } else {
      console.log(`Inserted ${result.affectedRows} row(s) into novel_categories.`);
      res.send('Category created successfully');
    }
  });
});

export default router;
