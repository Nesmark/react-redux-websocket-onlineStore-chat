import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';

import { Provider } from 'react-redux'
import Cookies from 'universal-cookie'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {blue500, pink500} from 'material-ui/styles/colors'

import { createStore } from 'redux';

const cookies = new Cookies();

window.onfocus = function(){ window.isFocus = true; }
window.onblur = function(){ window.isFocus = false; }

const aska = function(text){
    let audio = document.getElementById('aska_audio');
    let url = 'https://tts.voicetech.yandex.net/generate?'+
        'key=222499e2-1e45-4b6d-aaaa-70b53b87c2ec'+
        '&text='+encodeURI(text)+
        '&format=mp3'+
        '&lang=ru-RU'+
        '&topic=queries'+
        '&speaker=oksana'+
        '&speed=1'+
        '&robot=1'+
        '&emotion=evil';//evil
      audio.src = url;
      audio.load();
      audio.onloadeddata = function(){
        audio.play();
      }
}
const socket = new WebSocket("ws://nerv.pro:333/index.html");
//const socket = new WebSocket("ws://159.224.183.122:333/index.html");

const initialState = [
 {config:{shop_add:false,login:false,registration:false,options:false},
 	shop:[],
 	chat:{data:[],options:[]},
 	user:{userName:'Undefined'}
 }
];

function playlist(state=initialState, action) {
	if(action.type === 'RELOAD'){
		return [
		action.payload
		]
	}
	console.log(state)
	return state;
}

const store = createStore(playlist);

store.subscribe(()=>{
	//socket.send(store.getState());
	console.log('subscribe', store.getState())
})

socket.onopen = function() {
   console.log('SOCKET CONNECT')
   window.aska_socket = true
   console.log(cookies.get('user'));
   if(cookies.get('user')){
   	let obj = {type:'HOT_LOGIN',data:cookies.get('user')}
    socket.send(JSON.stringify(obj))
   }
 };
 socket.onclose = function(){
  window.aska_socket = false
 }

socket.onmessage = function(event) {
			console.log('///////////////////////')
	        console.log(event.data)
			let data = JSON.parse(event.data)
			let state = store.getState()
			switch(data.type) {

				case 'NEW_ONLINE':
				state[0].chat.options.forEach((v)=>{
					let rir = false
					data.data.forEach((m)=>{
						console.log(m+' == '+v.user)
						if(m == v.user){
						  rir=true
						}
					})
					if(rir){
						v.online = true
					}else{
						v.online = false
					}
				})
				console.log(state[0])
				store.dispatch({type: 'RELOAD', payload: state[0]})
				break;

				case 'NEW_MESSAGE':
				state[0].chat.data.push(data.data)
				//console.log('////////*********')
				//console.log(state[0].chat.data)
					let vz = {
    					config:state[0].config,
    					shop:state[0].shop,
    					chat:{data:state[0].chat.data,options:state[0].chat.options},
    					user:state[0].user
    				}
            !window.isFocus?aska('Новое сообщение'):localStorage.last_aska_message = data.data.message;
            
    				//console.log(vz)
    				store.dispatch({type: 'RELOAD', payload: vz})
				break;

    		case 'USER_CHAT':
            if(localStorage.userVisibility){
              var arrXY = JSON.parse(localStorage.userVisibility)

              data.options = data.options.map((v)=>{
                arrXY.forEach((w)=>{
                  if(v.user == w.user){
                    if(v.user != state[0].user.userName){
                      v.visibility = w.visibility
                    }
                  }
                })
                return v
              })
            }
            if(!window.isFocus && localStorage.last_aska_message != data.data[data.data.length-1].message){
              aska('новое сообщение')
             }

            window.isFocus?localStorage.last_aska_message = data.data[data.data.length-1].message:'';

    				let v = {
    					config:state[0].config,
    					shop:state[0].shop,
    					chat:{data:data.data,options:data.options},
    					user:state[0].user
    				}
    				console.log(v)
    				store.dispatch({type: 'RELOAD', payload: v})
    				break;

    			case 'ALL_SHOP':
    				let y = {
    					config:state[0].config,
    					shop:data.data,
    					chat:state[0].chat,
    					user:state[0].user
    				}
    				console.log(y)
    				store.dispatch({type: 'RELOAD', payload: y})
    			break;
    			
    			case 'LOGIN':
    				let kk = {
    					config:state[0].config,
    					shop:state[0].shop,
    					chat:state[0].chat,
    					user:data.data
    				}
    				kk.config.login = true
 					cookies.set('user', {name:kk.user.userName,password:kk.user.password}, { path: '/' });
    				store.dispatch({type: 'RELOAD', payload: kk})

    			break;
    			case 'LOGIN_FALSE':
    			let l = {
    					config:state[0].config,
    					shop:state[0].shop,
    					chat:state[0].chat,
    					user:state[0].user
    				}
    				console.log(l)
    				l.config.options = {login_false:true}
    				console.log(l)
    				store.dispatch({type: 'RELOAD', payload: l})
    			break;
    			
    	}
};
////////////////////////////////////////////////////////////////////////////
const hendlerLogin = function(data){
	//console.log(data)
	socket.send(JSON.stringify(data))
	//console.log(store.getState())
	//let r = store.getState()
	//r[0].config.login = true
 	//store.dispatch({type: 'RELOAD', payload:r[0]})
}
const hendlerLog_out = function(){
	cookies.set('user', '', { path: '/' });
	let r = store.getState()
	r[0].config.login = false
	store.dispatch({type: 'RELOAD', payload:r[0]})
	let obj = {type:'RELOAD_CONNECT'}
	socket.send(JSON.stringify(obj))
}
const hendlerRegistration = function(data){
	console.log(data)
	socket.send(JSON.stringify(data))
	console.log(store.getState())
	let r = store.getState()
	r[0].config.registration = false
 	store.dispatch({type: 'RELOAD', payload:r[0]})
}

const hendlerFormRegistration = function(){
	let r = store.getState()
	r[0].config.registration = true
 	store.dispatch({type: 'RELOAD', payload:r[0]})
}

const hendleGetChat = function(){
      socket.send(JSON.stringify({type:'GET_CHAT'}))
}
const hendlerMessageSend = function(op,message){
	let obj = {type:'MESSAGE_TO_CHAT',data:message,options:op}
	socket.send(JSON.stringify(obj))
}
const hendlerVisibility = function(name){
  let r = store.getState()
  let h
  r[0].chat.options.forEach((v,i)=>{
  	v.user == name?h=i:'';
  })
  r[0].chat.options[h].visibility?r[0].chat.options[h].visibility = false:r[0].chat.options[h].visibility = true;
  localStorage.userVisibility = JSON.stringify(r[0].chat.options)
  store.dispatch({type: 'RELOAD', payload:r[0]})
}
const hendlerVisibilityButton = function(name){
  let r = store.getState()
  let h
  r[0].chat.options.forEach((v,i)=>{
  	v.user == name?h=i:'';
  })
  r[0].chat.options.forEach((v,i)=>{
  	let r = store.getState()

  	if(v.user != r[0].user.userName){
  	v.visibility = false
  	}
  })
  r[0].chat.options[h].visibility?r[0].chat.options[h].visibility = false:r[0].chat.options[h].visibility = true;
  localStorage.userVisibility = JSON.stringify(r[0].chat.options)
  store.dispatch({type: 'RELOAD', payload:r[0]})
}
const hendleShopLike = function(data){
  socket.send(JSON.stringify({type:'ADD_SHOP_LIKE',data:data}))
}
const hendlerShopLoad = function(data){
  socket.send(JSON.stringify({type:'GET_SHOP'}))
}
const hendlerAddButton = function(data){
	console.log(store.getState())
	let r = store.getState()
	r[0].config.shop_add ? r[0].config.shop_add = false : r[0].config.shop_add = true;
	console.log(r)
 store.dispatch({type: 'RELOAD', payload:r[0]})
}
const avatarSend = function(file){
  //let obj = {type:'LOAD_AVATAR',file:file} 
  //socket.binaryType = 'arraybuffer';
  //socket.binaryType = 'blob';
  socket.send(file)
}
const hendlerAddShop = function(data){
	console.log(data)
	socket.send(JSON.stringify(data))

	console.log(store.getState())
	let r = store.getState()
	r[0].config.shop_add = true
 	store.dispatch({type: 'RELOAD', payload:r[0]})
}
const hendlerDeleteMessage = function(id){
  console.log(id)
  let obj = {type:'MESSAGE_DELETE',data:id}
  socket.send(JSON.stringify(obj))
}
/////////////////////////////////////////////////////////////////////////////////
const muiTheme = getMuiTheme({
	palette:{
		primary1Color: pink500,
		accent1Color: pink500
	}
})



ReactDOM.render(
	<Provider store={store}>
	<MuiThemeProvider muiTheme={muiTheme}>
		<App />
	</MuiThemeProvider>
	</Provider>,
	 document.getElementById('app')	
 ); 


export default { hendlerAddShop, hendlerAddButton, hendlerShopLoad , hendleShopLike,
 hendleGetChat, hendlerLogin, hendlerFormRegistration, hendlerRegistration, hendlerLog_out,
  hendlerVisibility, hendlerVisibilityButton, hendlerMessageSend, avatarSend, hendlerDeleteMessage}
