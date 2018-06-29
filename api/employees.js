const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//api/employees GET
employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee
          WHERE is_current_employee = 1`, (err, employees) => {
            if (err) {
              next(err);
            } else {
              res.send({employees: employees});
            };
          });
})

//api/employees/:employeeID GET
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

//api/employees POST
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !wage || !position) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
  'VALUES ($name, $position, $wage, $isCurrentEmployee)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

//api/employees/:employeeID PUT
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;

  if (!name || !position || !wage) {
    return res.status(400).send();
  };

  db.run(`UPDATE Employee
          SET name = $name, position = $position, wage = $wage
          WHERE id = $id`, {
            $name: name,
            $position: position,
            $wage: wage,
            $id: req.params.employeeId
          }, function(error) {
            if (error) {
              return next(error);
            };
            db.get('SELECT * FROM Employee WHERE id = $id', {$id: req.params.employeeId}, (err, employee) =>{
              if (err) {
                next(err);
              } else {
                res.status(200).send({employee: employee});
              };
            });
          });
})

//api/employees/:employeeID DELETE
employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.run(`UPDATE Employee
          SET is_current_employee = 0
          WHERE id = $id`, {$id: req.params.employeeId}, function (error){
            if (error) {
              next(error);
            };
            db.get('SELECT * FROM Employee WHERE id = $id', {$id: req.params.employeeId}, (error, employee) => {
              if (error) {
                next(error);
              } else {
                res.send({employee: employee});
              };
            });
          });
})


module.exports = employeesRouter;
