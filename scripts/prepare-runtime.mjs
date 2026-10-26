import {rm} from 'node:fs/promises';
import {indexablePaths} from '../src/seo.js';
// Public pages are rendered from the published database snapshot in Vercel.
// Removing static counterparts ensures cleanUrls never serves an old catalog.
if(process.env.VERCEL)for(const path of indexablePaths)await rm('dist/'+(path==='/'?'index':path.slice(1))+'.html',{force:true});
