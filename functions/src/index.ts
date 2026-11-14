import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
// @ts-ignore: moment locale module is loaded for side effects only
import 'moment/locale/da';
import moment = require('moment-timezone');

initializeApp();
setGlobalOptions({ region: 'europe-west1' });

moment.locale('da');
moment.tz.setDefault('Europe/Copenhagen');

import * as admin from './modules/admin';
import * as auth from './modules/auth';
import * as booking from './modules/booking';
import * as storage from './modules/storage';
import * as training from './modules/training';

exports.admin = admin;
exports.auth = auth;
exports.booking = booking;
exports.storage = storage;
exports.training = training;
