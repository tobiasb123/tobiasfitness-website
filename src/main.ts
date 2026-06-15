import { bootstrapApplication } from '@angular/platform-browser';
import moment from 'moment-timezone';
import { App } from './app/app.component';
import { appConfig } from './app/app.config';
// @ts-ignore: moment locale module is loaded for side effects only
import 'moment/locale/da.js';

moment.locale('da');
moment.tz.setDefault('Europe/Copenhagen');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
