import React, {useEffect, useState} from 'react'

export default function App(){
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')

  useEffect(()=>{
    fetch('/api/products' + (q ? '?q=' + encodeURIComponent(q) : '')).then(r=>r.json()).then(setProducts)
  },[q])

  return (
    <div style={{fontFamily:'Quicksand, sans-serif',padding:20}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>Tiny Knots Shop</h1>
        <a href="/">Back home</a>
      </header>
      <div style={{margin:'16px 0'}}>
        <input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #eee'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
        {products.map(p=> (
          <div key={p.id} style={{padding:12,background:'#fff',borderRadius:10,boxShadow:'0 8px 20px rgba(0,0,0,0.06)'}}>
            <img src={p.image} alt="" style={{width:'100%',height:140,objectFit:'cover',borderRadius:8}} />
            <h3 style={{margin:'8px 0'}}>{p.title}</h3>
            <div style={{color:'#ff6fa4',fontWeight:700}}>₹{p.price}</div>
            <div style={{marginTop:8}}>
              <button onClick={()=>fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{productId:p.id,quantity:1}]})}).then(r=>r.json()).then(d=>{ if(d.success) localStorage.setItem('lastCartId', d.cartId)})} style={{padding:'8px 12px',borderRadius:8,background:'#ff9ac2',color:'#fff',border:'none'}}>Add</button>
              <a href={`/product.html?id=${p.id}`} style={{marginLeft:8}}>View</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
