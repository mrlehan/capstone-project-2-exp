const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// /menu-items GET
menuItemsRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM MenuItem WHERE menu_id = $menuId', {$menuId: req.params.menuId},
  (error, menuItems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  });
});

// /menu-items POST
menuItemsRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;
  if (!name || !inventory || !price) {
        return res.sendStatus(400);
  }

  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
  'VALUES ($name, $description, $inventory, $price, $menuId)';
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuId: req.params.menuId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
        (error, menuItem) => {
          res.status(201).json({menuItem: menuItem});
        });
    }
  });
});

// /menu-items/:menuItemId PUT
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const name = req.body.menuItem.name,
        description = req.body.menuItem.description,
        inventory = req.body.menuItem.inventory,
        price = req.body.menuItem.price;

  if (!name || !description || !inventory || ! price) {
      return res.status(400).send();
  };

  db.run('UPDATE MenuItem SET name = $name, description = $description, ' +
          'inventory = $inventory, price = $price, menu_id = $menuId ' +
          'WHERE id = $id', {
            $name: name,
            $description: description,
            $inventory: inventory,
            $price: price,
            $menuId: req.params.menuId,
            $id: req.params.menuItemId
            }, function(error) {
              if(error) {
              return next(error);
              };
              db.get('SELECT * FROM MenuItem WHERE id = $id', {$id: req.params.menuItemId}, (err, item) => {
                if(error) {
                next(error);
                } else {
                  res.send({menuItem: item});
                };
             });
          });
})

// /menu-items/:menuItemId DELETE
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const menuSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const menuValues = {$menuId: req.params.menuId};
  db.get(menuSql, menuValues, (error, menuItem) => {
    if (error) {
      next(error);
    } else {
      const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
      const values = {$menuItemId: req.params.menuItemId};

      db.run(sql, values, (error) => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = menuItemsRouter;
