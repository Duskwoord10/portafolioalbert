import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existingNavigation, publishedNavigation } from './navigation.js'

test('el menú publicado sustituye los enlaces anteriores y conserva su orden', () => {
  assert.deepEqual(publishedNavigation([]), existingNavigation)
  assert.deepEqual(publishedNavigation([{ slug:'principal', data:{ blocks:[
    { type:'link',title:'Blog',url:'/blog' },
    { type:'link',title:'Peligroso',url:'javascript:alert(1)' },
    { type:'link',title:'Inicio',url:'/' },
  ] } }]), [
    { to:'/blog',label:'Blog',end:false }, { to:'/',label:'Inicio',end:true },
  ])
})
