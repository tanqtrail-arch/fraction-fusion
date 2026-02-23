const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../lib/store');

const router = express.Router();

// POST /api/parent-login
// Body: { tenant_slug, student_name, pin }
// Returns: { token, url }
router.post('/parent-login', function (req, res) {
  var studentName = req.body.student_name;
  var pin = req.body.pin;

  if (!studentName || !pin) {
    return res.status(400).json({ error: '生徒名とPINを入力してください' });
  }

  var data = readData();
  var student = data.students.find(function (s) {
    return s.name === studentName;
  });

  if (!student) {
    return res.status(401).json({ error: '生徒が見つかりません' });
  }

  // pin列がなければ初期値「0000」で追加
  if (!student.pin) {
    student.pin = '0000';
    writeData(data);
  }

  if (student.pin !== pin) {
    return res.status(401).json({ error: 'PINが違います' });
  }

  var token = uuidv4();
  data.parentTokens[token] = {
    studentId: student.id,
    pin: student.pin,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  writeData(data);

  return res.json({
    token: token,
    url: '/parent.html?token=' + token
  });
});

// GET /api/parent-tokens/verify?token=xxx
// Returns: { valid, student: { name, className, altHistory, teacherComments, playHistory } }
router.get('/parent-tokens/verify', function (req, res) {
  var token = req.query.token;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'トークンが必要です' });
  }

  var data = readData();
  var tokenData = data.parentTokens[token];

  if (!tokenData) {
    return res.status(401).json({ valid: false, error: '無効なトークンです' });
  }

  if (new Date(tokenData.expiresAt) < new Date()) {
    delete data.parentTokens[token];
    writeData(data);
    return res.status(401).json({ valid: false, error: 'トークンの有効期限が切れています' });
  }

  var student = data.students.find(function (s) {
    return s.id === tokenData.studentId;
  });

  if (!student) {
    return res.status(404).json({ valid: false, error: '生徒が見つかりません' });
  }

  return res.json({
    valid: true,
    student: {
      name: student.name,
      className: student.className,
      altHistory: student.altHistory,
      teacherComments: student.teacherComments,
      playHistory: student.playHistory
    }
  });
});

// POST /api/parent-tokens
// Body: { studentName, pin }
// Returns: { token, pin, studentName }
router.post('/parent-tokens', function (req, res) {
  var studentName = req.body.studentName;
  var pin = req.body.pin;

  if (!studentName || !pin) {
    return res.status(400).json({ error: '名前とPINが必要です' });
  }

  var data = readData();
  var student = data.students.find(function (s) {
    return s.name === studentName;
  });

  if (!student) {
    return res.status(404).json({ error: '生徒が見つかりません' });
  }

  if (student.pin !== pin) {
    return res.status(401).json({ error: 'PINが正しくありません' });
  }

  var token = uuidv4();
  data.parentTokens[token] = {
    studentId: student.id,
    pin: student.pin,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  writeData(data);

  return res.json({
    token: token,
    pin: student.pin,
    studentName: student.name
  });
});

module.exports = router;
