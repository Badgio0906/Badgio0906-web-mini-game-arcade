// Explicit QA-only Vite input; never part of the published site.
import {mirrorNativeBest,readLegacyMirror} from '../../src/records/legacyStore';
import {installLegacyRecords} from '../../src/records/LegacyGameRecords';
import {mountRecordSharingSettings} from '../../src/records/RecordSharing';
const header=document.createElement('header');header.className='legacy-navigation';document.body.append(header);
const frame=document.createElement('iframe');frame.id='legacy-game-frame';document.body.append(frame);
const settings=document.createElement('aside');document.body.append(settings);mountRecordSharingSettings(settings);
document.body.dataset.game='game012';installLegacyRecords('game012');
Object.defineProperty(window,'__LEGACY_FIXTURE__',{value:{mirror:mirrorNativeBest,read:readLegacyMirror,launch(){frame.src=`./games/yokodori-days/game.html?records_session=${crypto.randomUUID()}`;}}});
