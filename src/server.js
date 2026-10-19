require('dotenv').config();
if(process.env.NODE_ENV==='production'&&(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)){console.error('SESSION_SECRET debe tener al menos 32 caracteres en producción.');process.exit(1);}
const app=require('./app');
const port=Number(process.env.PORT)||3000;
const server=app.listen(port,'0.0.0.0',()=>console.log(`Bite Me disponible en http://localhost:${port}`));
async function shutdown(){console.log('Cerrando servidor...');server.close(async()=>{await app.locals.pool.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
