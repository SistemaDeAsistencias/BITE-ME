require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
const categories = [['Clásicas','clasicas'],['Chispas de chocolate','chispas-chocolate'],['Rellenas','rellenas'],['Especiales','especiales'],['Cajas de regalo','cajas-regalo'],['Combos','combos']];
const products = [
 ['Choco Chip Classic','choco-chip-classic','Galleta doradita, suave al centro y llena de chispas de chocolate.','7.50','https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85','Chispas de chocolate',24,true,'Más vendido'],
 ['Double Chocolate','double-chocolate','Doble chocolate para los antojos que no aceptan medias tintas.','8.50','https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85','Especiales',18,true,'Favorito'],
 ['Red Velvet Cookie','red-velvet-cookie','Textura tierna, color intenso y un toque cremoso.','9.00','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85','Especiales',14,true,'Nuevo'],
 ['Cookie Rellena','cookie-rellena','Galleta artesanal con centro cremoso de chocolate y avellanas.','10.00','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85','Rellenas',12,false,'Rellena'],
 ['Avena & Chocolate','avena-chocolate','Avena, chocolate y ese sabor casero que reconforta.','7.00','https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85','Clásicas',20,false,null],
 ['Caja Bite Me x 6','caja-bite-me-6','Seis favoritas en una caja lista para regalar (o no compartir).','42.00','https://images.unsplash.com/photo-1608198093002-ad4e005484e2?auto=format&fit=crop&w=900&q=85','Cajas de regalo',10,true,'Para regalar'],
 ['Caja Bite Me x 12','caja-bite-me-12','Doce bocados artesanales para celebrar en grande.','78.00','https://images.unsplash.com/photo-1608198093002-ad4e005484e2?auto=format&fit=crop&w=900&q=85','Combos',8,false,'Ahorra más']
];
(async()=>{try{
 for(const [name,slug] of categories) await pool.query('INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO NOTHING',[name,slug]);
 for(const p of products){const cat=await pool.query('SELECT id FROM categories WHERE name=$1',[p[5]]); await pool.query(`INSERT INTO products(name,slug,description,price,image_url,category_id,stock,featured,tag) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(slug) DO NOTHING`,[p[0],p[1],p[2],p[3],p[4],cat.rows[0].id,p[6],p[7],p[8]]);}
 if(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD){if(process.env.ADMIN_PASSWORD.length<12) throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.'); const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12); await pool.query(`INSERT INTO users(full_name,email,password_hash,role) VALUES($1,lower($2),$3,'admin') ON CONFLICT(email) DO NOTHING`,[process.env.ADMIN_NAME||'Administrador',process.env.ADMIN_EMAIL,hash]);}
 console.log('Datos iniciales revisados. No se duplican categorías ni productos.');
}catch(e){console.error(e.message);process.exitCode=1}finally{await pool.end()}})();
