import moment from 'moment-timezone';
// @ts-ignore: moment locale module is loaded for side effects only
import 'moment/locale/da.js';

moment.locale('da');
moment.tz.setDefault('Europe/Copenhagen');

export default moment;
