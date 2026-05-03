import { initializeApp } from 'firebase-admin/app';
// @ts-ignore: moment locale module is loaded for side effects only
import 'moment/locale/da';
import moment = require('moment-timezone');

initializeApp();
moment.locale('da');
moment.tz.setDefault('Europe/Copenhagen');

import * as admin from './modules/admin';
import * as auth from './modules/auth';
import * as booking from './modules/booking';

exports.admin = admin;
exports.auth = auth;
exports.booking = booking;
