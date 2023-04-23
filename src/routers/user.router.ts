import { Router } from "express";
import { sample_users } from "../data";
import jwt from 'jsonwebtoken';
import { db } from "../server";
import bcrypt from 'bcryptjs';
import { HTTP_BAD_REQUEST } from '../constants/http_status';

const router = Router();

router.get('/get/user/:email', (req, res) => {
  const email = req.params.email;
  const sql = `SELECT *
              FROM users
              WHERE email = ?`;

  db.query(sql, [email], (error, results, fields) => {
    if (error) throw error;
    else {
      const user = {
        user_id: results[0].user_id,
        full_name: results[0].full_name,
        email: results[0].email,
        password: results[0].password,
        role: results[0].role,
        created: results[0].created_at,
        updated: results[0].updated_at,
      };

      res.send(user);
    }
  });
});

router.get("/get/users", (req, res) => {
  db.query("SELECT * FROM users", function(error, results, fields) {
      if(error) throw error;
      res.send(results);
  });
});

// router.get('/get/users', (req, res) => {

//   db.query(`SELECT * FROM users `, function (error, usersResult) {
//     if (error) {
//       console.log(error);
//     } else {
//       const user = {
//         user_id: usersResult[0].user_id,
//         full_name: usersResult[0].full_name,
//         email: usersResult[0].email,
//         password: usersResult[0].password,
//         role: usersResult[0].role,
//         created: usersResult[0].created_at,
//         updated: usersResult[0].updated_at,
//       };

//       res.send(user);
//     }
//   });
// });

router.post('/post/newUser', (
  (req, res) => {
   const {email, password, full_name, role} = req.body;
   const query = 'SELECT * FROM users WHERE email = ?';
   const values = [email];

   db.query(query, values, async (error, results) => {
     if (error) {
       console.log(error);
       return res.status(500).send("Internal Server Error");
     } else if (results.length > 0) {
       return res.status(HTTP_BAD_REQUEST).send("Email đã tồn tại!");
     } else {
       const encryptedPassword = await bcrypt.hash(password, 8);
       const query = 'INSERT INTO users (email, password, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
       const values = [email, encryptedPassword, full_name, role];

       db.query(query, values, async (error, results) => {
         if (error) {
           console.log(error);
           return res.status(500).send("Internal Server Error");
         } else {
           res.status(200).json({ ok: true });
         }
       });
     }
   });
 }
));

router.get('/get/userById/:id', (req, res) => {
  const id = req.params.id;

  db.query(`SELECT *
            FROM users 
            WHERE user_id = ${id}`, async (err, usersResult) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (usersResult.length === 0) {
      return res.status(404).send('User not found');
    } else {
      const user = {
        user_id: usersResult[0].user_id,
        full_name: usersResult[0].full_name,
        email: usersResult[0].email,
        password: usersResult[0].password,
        role: usersResult[0].role,
        created: usersResult[0].created_at,
        updated: usersResult[0].updated_at,
      };

      res.send(user);
    }
  });
});

router.delete('/delete/user/:id', (req, res) => {
  const id = req.params.id;

  db.query(`DELETE FROM users WHERE user_id = ${id}`, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Internal server error');
    } else if (result.affectedRows === 0) {
      return res.status(404).send('User not found');
    } else {
      res.status(200).json({ ok: true });
    }
  });
});

router.post("/login", (req, res) => {
    const {email, password} = req.body;
    const query = `SELECT * FROM users WHERE email = ?`;
    const values = [email];

    db.query(query, values, async (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).send("Internal Server Error");
        } else if (results.length === 0) {
          return res.status(HTTP_BAD_REQUEST).send("Username or password not valid!");
        } else {
            const user = results[0];
            if(await bcrypt.compare(password, user.password)) {
              const dbUser = {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
                res.send(generateTokenResponse(dbUser));
            } else {
              return res.status(HTTP_BAD_REQUEST).send("Username or password not valid!");
            }
        }
    });
});

router.post('/register', (
     (req, res) => {
      const {email, password, full_name} = req.body;
      const query = 'SELECT * FROM users WHERE email = ?';
      const values = [email];
  
      db.query(query, values, async (error, results) => {
        if (error) {
          console.log(error);
          return res.status(500).send("Internal Server Error");
        } else if (results.length > 0) {
          return res.status(HTTP_BAD_REQUEST).send("Email đã tồn tại!");
        } else {
          const encryptedPassword = await bcrypt.hash(password, 8);
          const query = 'INSERT INTO users (email, password, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())';
          const values = [email, encryptedPassword, full_name, 2];
  
          db.query(query, values, async (error, results) => {
            if (error) {
              console.log(error);
              return res.status(500).send("Internal Server Error");
            } else {
              const dbUser = {
                user_id: results.user_id,
                email,
                password: encryptedPassword,
                full_name,
                role: 2,
              };
              res.send(generateTokenResponse(dbUser));
            }
          });
        }
      });
    }
  ));

const generateTokenResponse = (user:any) => {
    const token = jwt.sign({
      user_id: user.user_id, email:user.email, role:user.role
    }, "SomeRandomText", {
        expiresIn: "30d"
    })
    user.token = token;
    return {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      token: token
    };
}


export default router;