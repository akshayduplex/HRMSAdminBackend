const mongoose = require('mongoose');

//['P=>Present', 'A=>Absent', 'L=>Leave','H=>Holiday','S=>Saturday/Sunday']

const attendanceListData = new mongoose.Schema({
      date_text:{
        type: String,
      },
      date_on:{
        type: Date,
      },
      status: {
        type: String,
        enum: ['P', 'A', 'L','H','S'],
        default: 'P'
      },
      time_off_type: {
          type: String,
          enum: ['FullDay', 'HalfDay'],
      },
      leave_category: {
          type: String
      },
      leave_status:{
          type: String,
          enum: ['Applied','Approved','Reject'],
          default: false
      },
      attempt_by:{
          type: String
      },
      check_in: {
          type: Date
      },
      check_out: {
          type: Date
      },
      hours_worked:{
        type: Number,
        default: 0
      },
      overtime:{
        type: Number,
        default: 0
      }
});

const attendanceSchema = new mongoose.Schema({
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'dt_employee_lists',
    },
    project_id: {
        type: mongoose.Types.ObjectId,
    },
    project_name: {
        type: String,
        trim: true
    },
    employee_code: {
        type: String,
        trim: true
    },
    name:{
        type: String
    },
    ctc:{
        type: Number,
        default: 0
    }, 
    month:{
        type: String
    },
    year:{
        type: String
    },
    add_date: {
        type: Date,
        required: true
    },
    deduction:{
        type: Number,
        default: 0,
        remark: 'total deduction per month'
    },
    reimbursement:{
        type: Number,
        default: 0,
        remark: 'total deduction per month'
    },
    total_payroll:{
        type: Number,
        default: 0
    },
    days_worked:{
        type: Number,
        default: 0
    },
    hours_worked:{
        type: Number,
        default: 0
    },
    overtime:{
        type: Number,
        default: 0
    },
    days_absent:{
        type: Number,
        default: 0
    },
    days_leave:{
        type: Number,
        default: 0
    },
    holidays:{
        type: Number,
        default: 0
    },
    check_in_default:{
        type: String
    },
    check_out_default:{
        type: String
    },
    attendance_list:[attendanceListData]
  });

  const AttendanceCI =  mongoose.model('dt_attendance_list', attendanceSchema );

  module.exports = AttendanceCI;
  