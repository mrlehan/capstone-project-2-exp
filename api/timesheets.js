const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// /timesheets GET
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = { $employeeId: req.params.employeeId};
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

// /timesheets POST
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;

  if (!hours || !rate || !date) {
    return res.status(400).send();
  }
  db.run('INSERT INTO Timesheet (hours, rate, date, employee_id)' +
      'VALUES ($hours, $rate, $date, $employeeId)', {
            $hours: hours,
            $rate: rate,
            $date: date,
            $employeeId: req.params.employeeId
          }, function (error) {
            if (error) {
              next(error)
            };
            db.get('SELECT * FROM Timesheet WHERE id = $id', {$id: this.lastID}, (error, timesheet) =>{
              if (error) {
                next(error);
              } else {
                res.status(201).send({timesheet:timesheet});
              };
            });
          });
})

// /timesheets/:timesheetId PUT
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;

  if (!hours || !rate || !date) {
    return res.status(400).send();
  };

  db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, ' +
      'date = $date, employee_id = $employeeId ' +
      'WHERE id = $id',{
            $hours: hours,
            $rate: rate,
            $date: date,
            $employeeId: req.params.employeeId,
            $id: req.params.timesheetId
          }, error=> {
            if (error) {
              return next(error);
            };
            db.get('SELECT * FROM Timesheet WHERE id = $id', {$id: req.params.timesheetId}, (error, timesheet)=>{
              if(error) {
                next(error);
              } else {
                res.send({timesheet:timesheet});
              };
            });
          });
})

// /timesheets/:timesheetId DELETE
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
