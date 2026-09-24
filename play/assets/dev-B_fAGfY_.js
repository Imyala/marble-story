(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function e(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=e(n);fetch(n.href,s)}})();const eh="186",$d=0,Gh=1,Zd=2,Bs=1,Kd=2,Ns=3,Sn=0,ei=1,we=2,qi=0,Un=1,xi=2,Vh=3,Wh=4,Jd=5,os=100,Qd=101,jd=102,tu=103,eu=104,iu=200,nu=201,su=202,au=203,Lc=204,Dc=205,ru=206,ou=207,hu=208,lu=209,cu=210,du=211,uu=212,fu=213,pu=214,ro=0,oo=1,ho=2,Ws=3,lo=4,co=5,uo=6,fo=7,Ic=0,mu=1,gu=2,Yi=0,ih=1,nh=2,sh=3,er=4,ah=5,rh=6,oh=7,Nc=300,Fn=301,ds=302,lr=303,cr=304,ir=306,po=1e3,rn=1001,mo=1002,Xe=1003,vu=1004,sa=1005,Qe=1006,dr=1007,In=1008,vi=1009,Uc=1010,Fc=1011,Xs=1012,hh=1013,Zi=1014,Di=1015,ci=1016,lh=1017,ch=1018,qs=1020,zc=35902,Bc=35899,Oc=1021,Hc=1022,Ii=1023,hn=1026,Nn=1027,dh=1028,uh=1029,zn=1030,fh=1031,ph=1033,Ba=33776,Oa=33777,Ha=33778,Ga=33779,go=35840,vo=35841,xo=35842,yo=35843,_o=36196,Mo=37492,wo=37496,bo=37488,So=37489,qa=37490,To=37491,Eo=37808,Ao=37809,Ro=37810,Co=37811,Po=37812,ko=37813,Lo=37814,Do=37815,Io=37816,No=37817,Uo=37818,Fo=37819,zo=37820,Bo=37821,Oo=36492,Ho=36494,Go=36495,Vo=36283,Wo=36284,Ya=36285,Xo=36286,xu=3200,qo=0,yu=1,Mn="",mi="srgb",$a="srgb-linear",Za="linear",fe="srgb",ur=7680,_u=519,Mu=512,wu=513,bu=514,mh=515,Su=516,Tu=517,gh=518,Eu=519,Au=35044,fr=35048,Xh="300 es",Wi=2e3,Ys=2001;function Ru(a){for(let t=a.length-1;t>=0;--t)if(a[t]>=65535)return!0;return!1}function Ka(a){return document.createElementNS("http://www.w3.org/1999/xhtml",a)}function Cu(){const a=Ka("canvas");return a.style.display="block",a}const qh={};function Yh(...a){const t="THREE."+a.shift();console.log(t,...a)}function Gc(a){const t=a[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=a[1];e&&e.isStackTrace?a[0]+=" "+e.getLocation():a[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return a}function Bt(...a){a=Gc(a);const t="THREE."+a.shift();{const e=a[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...a)}}function re(...a){a=Gc(a);const t="THREE."+a.shift();{const e=a[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...a)}}function ls(...a){const t=a.join(" ");t in qh||(qh[t]=!0,Bt(...a))}function Pu(a,t,e){return new Promise(function(i,n){function s(){switch(a.clientWaitSync(t,a.SYNC_FLUSH_COMMANDS_BIT,0)){case a.WAIT_FAILED:n();break;case a.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:i()}}setTimeout(s,e)})}const ku={[ro]:oo,[ho]:uo,[lo]:fo,[Ws]:co,[oo]:ro,[uo]:ho,[fo]:lo,[co]:Ws};class Hn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){const i=this._listeners;if(i===void 0)return;const n=i[t];if(n!==void 0){const s=n.indexOf(e);s!==-1&&n.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const i=e[t.type];if(i!==void 0){t.target=this;const n=i.slice(0);for(let s=0,r=n.length;s<r;s++)n[s].call(this,t);t.target=null}}}const Ze=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],pr=Math.PI/180,Yo=180/Math.PI;function gs(){const a=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ze[a&255]+Ze[a>>8&255]+Ze[a>>16&255]+Ze[a>>24&255]+"-"+Ze[t&255]+Ze[t>>8&255]+"-"+Ze[t>>16&15|64]+Ze[t>>24&255]+"-"+Ze[e&63|128]+Ze[e>>8&255]+"-"+Ze[e>>16&255]+Ze[e>>24&255]+Ze[i&255]+Ze[i>>8&255]+Ze[i>>16&255]+Ze[i>>24&255]).toLowerCase()}function $t(a,t,e){return Math.max(t,Math.min(e,a))}function Lu(a,t){return(a%t+t)%t}function mr(a,t,e){return(1-e)*a+e*t}function bs(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return a/4294967295;case Uint16Array:return a/65535;case Uint8Array:case Uint8ClampedArray:return a/255;case Int32Array:return Math.max(a/2147483647,-1);case Int16Array:return Math.max(a/32767,-1);case Int8Array:return Math.max(a/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ri(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return Math.round(a*4294967295);case Uint16Array:return Math.round(a*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(a*255);case Int32Array:return Math.round(a*2147483647);case Int16Array:return Math.round(a*32767);case Int8Array:return Math.round(a*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class ht{static{ht.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,n=t.elements;return this.x=n[0]*e+n[3]*i+n[6],this.y=n[1]*e+n[4]*i+n[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar($t(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos($t(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),n=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*i-r*n+t.x,this.y=s*n+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Gn{constructor(t=0,e=0,i=0,n=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=n}static slerpFlat(t,e,i,n,s,r,o){let h=i[n+0],l=i[n+1],c=i[n+2],u=i[n+3],d=s[r+0],f=s[r+1],m=s[r+2],v=s[r+3];if(u!==v||h!==d||l!==f||c!==m){let p=h*d+l*f+c*m+u*v;p<0&&(d=-d,f=-f,m=-m,v=-v,p=-p);let g=1-o;if(p<.9995){const y=Math.acos(p),b=Math.sin(y);g=Math.sin(g*y)/b,o=Math.sin(o*y)/b,h=h*g+d*o,l=l*g+f*o,c=c*g+m*o,u=u*g+v*o}else{h=h*g+d*o,l=l*g+f*o,c=c*g+m*o,u=u*g+v*o;const y=1/Math.sqrt(h*h+l*l+c*c+u*u);h*=y,l*=y,c*=y,u*=y}}t[e]=h,t[e+1]=l,t[e+2]=c,t[e+3]=u}static multiplyQuaternionsFlat(t,e,i,n,s,r){const o=i[n],h=i[n+1],l=i[n+2],c=i[n+3],u=s[r],d=s[r+1],f=s[r+2],m=s[r+3];return t[e]=o*m+c*u+h*f-l*d,t[e+1]=h*m+c*d+l*u-o*f,t[e+2]=l*m+c*f+o*d-h*u,t[e+3]=c*m-o*u-h*d-l*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,n){return this._x=t,this._y=e,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,n=t._y,s=t._z,r=t._order,o=Math.cos,h=Math.sin,l=o(i/2),c=o(n/2),u=o(s/2),d=h(i/2),f=h(n/2),m=h(s/2);switch(r){case"XYZ":this._x=d*c*u+l*f*m,this._y=l*f*u-d*c*m,this._z=l*c*m+d*f*u,this._w=l*c*u-d*f*m;break;case"YXZ":this._x=d*c*u+l*f*m,this._y=l*f*u-d*c*m,this._z=l*c*m-d*f*u,this._w=l*c*u+d*f*m;break;case"ZXY":this._x=d*c*u-l*f*m,this._y=l*f*u+d*c*m,this._z=l*c*m+d*f*u,this._w=l*c*u-d*f*m;break;case"ZYX":this._x=d*c*u-l*f*m,this._y=l*f*u+d*c*m,this._z=l*c*m-d*f*u,this._w=l*c*u+d*f*m;break;case"YZX":this._x=d*c*u+l*f*m,this._y=l*f*u+d*c*m,this._z=l*c*m-d*f*u,this._w=l*c*u-d*f*m;break;case"XZY":this._x=d*c*u-l*f*m,this._y=l*f*u-d*c*m,this._z=l*c*m+d*f*u,this._w=l*c*u+d*f*m;break;default:Bt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,n=Math.sin(i);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],n=e[4],s=e[8],r=e[1],o=e[5],h=e[9],l=e[2],c=e[6],u=e[10],d=i+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(c-h)*f,this._y=(s-l)*f,this._z=(r-n)*f}else if(i>o&&i>u){const f=2*Math.sqrt(1+i-o-u);this._w=(c-h)/f,this._x=.25*f,this._y=(n+r)/f,this._z=(s+l)/f}else if(o>u){const f=2*Math.sqrt(1+o-i-u);this._w=(s-l)/f,this._x=(n+r)/f,this._y=.25*f,this._z=(h+c)/f}else{const f=2*Math.sqrt(1+u-i-o);this._w=(r-n)/f,this._x=(s+l)/f,this._y=(h+c)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs($t(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const n=Math.min(1,e/i);return this.slerp(t,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,n=t._y,s=t._z,r=t._w,o=e._x,h=e._y,l=e._z,c=e._w;return this._x=i*c+r*o+n*l-s*h,this._y=n*c+r*h+s*o-i*l,this._z=s*c+r*l+i*h-n*o,this._w=r*c-i*o-n*h-s*l,this._onChangeCallback(),this}slerp(t,e){let i=t._x,n=t._y,s=t._z,r=t._w,o=this.dot(t);o<0&&(i=-i,n=-n,s=-s,r=-r,o=-o);let h=1-e;if(o<.9995){const l=Math.acos(o),c=Math.sin(l);h=Math.sin(h*l)/c,e=Math.sin(e*l)/c,this._x=this._x*h+i*e,this._y=this._y*h+n*e,this._z=this._z*h+s*e,this._w=this._w*h+r*e,this._onChangeCallback()}else this._x=this._x*h+i*e,this._y=this._y*h+n*e,this._z=this._z*h+s*e,this._w=this._w*h+r*e,this.normalize();return this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),n=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(n*Math.sin(t),n*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{static{C.prototype.isVector3=!0}constructor(t=0,e=0,i=0){this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion($h.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion($h.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,n=this.z,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6]*n,this.y=s[1]*e+s[4]*i+s[7]*n,this.z=s[2]*e+s[5]*i+s[8]*n,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,n=this.z,s=t.elements,r=1/(s[3]*e+s[7]*i+s[11]*n+s[15]);return this.x=(s[0]*e+s[4]*i+s[8]*n+s[12])*r,this.y=(s[1]*e+s[5]*i+s[9]*n+s[13])*r,this.z=(s[2]*e+s[6]*i+s[10]*n+s[14])*r,this}applyQuaternion(t){const e=this.x,i=this.y,n=this.z,s=t.x,r=t.y,o=t.z,h=t.w,l=2*(r*n-o*i),c=2*(o*e-s*n),u=2*(s*i-r*e);return this.x=e+h*l+r*u-o*c,this.y=i+h*c+o*l-s*u,this.z=n+h*u+s*c-r*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,n=this.z,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*n,this.y=s[1]*e+s[5]*i+s[9]*n,this.z=s[2]*e+s[6]*i+s[10]*n,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar($t(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,n=t.y,s=t.z,r=e.x,o=e.y,h=e.z;return this.x=n*h-s*o,this.y=s*r-i*h,this.z=i*o-n*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return gr.copy(this).projectOnVector(t),this.sub(gr)}reflect(t){return this.sub(gr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos($t(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,n=this.z-t.z;return e*e+i*i+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const n=Math.sin(e)*t;return this.x=n*Math.sin(i),this.y=Math.cos(e)*t,this.z=n*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=n,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const gr=new C,$h=new Gn;class Ht{static{Ht.prototype.isMatrix3=!0}constructor(t,e,i,n,s,r,o,h,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,n,s,r,o,h,l)}set(t,e,i,n,s,r,o,h,l){const c=this.elements;return c[0]=t,c[1]=n,c[2]=o,c[3]=e,c[4]=s,c[5]=h,c[6]=i,c[7]=r,c[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,n=e.elements,s=this.elements,r=i[0],o=i[3],h=i[6],l=i[1],c=i[4],u=i[7],d=i[2],f=i[5],m=i[8],v=n[0],p=n[3],g=n[6],y=n[1],b=n[4],x=n[7],S=n[2],T=n[5],R=n[8];return s[0]=r*v+o*y+h*S,s[3]=r*p+o*b+h*T,s[6]=r*g+o*x+h*R,s[1]=l*v+c*y+u*S,s[4]=l*p+c*b+u*T,s[7]=l*g+c*x+u*R,s[2]=d*v+f*y+m*S,s[5]=d*p+f*b+m*T,s[8]=d*g+f*x+m*R,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],h=t[6],l=t[7],c=t[8];return e*r*c-e*o*l-i*s*c+i*o*h+n*s*l-n*r*h}invert(){const t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],h=t[6],l=t[7],c=t[8],u=c*r-o*l,d=o*h-c*s,f=l*s-r*h,m=e*u+i*d+n*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/m;return t[0]=u*v,t[1]=(n*l-c*i)*v,t[2]=(o*i-n*r)*v,t[3]=d*v,t[4]=(c*e-n*h)*v,t[5]=(n*s-o*e)*v,t[6]=f*v,t[7]=(i*h-l*e)*v,t[8]=(r*e-i*s)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,n,s,r,o){const h=Math.cos(s),l=Math.sin(s);return this.set(i*h,i*l,-i*(h*r+l*o)+r+t,-n*l,n*h,-n*(-l*r+h*o)+o+e,0,0,1),this}scale(t,e){return ls("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(vr.makeScale(t,e)),this}rotate(t){return ls("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(vr.makeRotation(-t)),this}translate(t,e){return ls("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(vr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let n=0;n<9;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const vr=new Ht,Zh=new Ht().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Kh=new Ht().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Du(){const a={enabled:!0,workingColorSpace:$a,spaces:{},convert:function(n,s,r){return this.enabled===!1||s===r||!s||!r||(this.spaces[s].transfer===fe&&(n.r=on(n.r),n.g=on(n.g),n.b=on(n.b)),this.spaces[s].primaries!==this.spaces[r].primaries&&(n.applyMatrix3(this.spaces[s].toXYZ),n.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===fe&&(n.r=cs(n.r),n.g=cs(n.g),n.b=cs(n.b))),n},workingToColorSpace:function(n,s){return this.convert(n,this.workingColorSpace,s)},colorSpaceToWorking:function(n,s){return this.convert(n,s,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===Mn?Za:this.spaces[n].transfer},getToneMappingMode:function(n){return this.spaces[n].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(n,s=this.workingColorSpace){return n.fromArray(this.spaces[s].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,s,r){return n.copy(this.spaces[s].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(n,s){return ls("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),a.workingToColorSpace(n,s)},toWorkingColorSpace:function(n,s){return ls("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),a.colorSpaceToWorking(n,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return a.define({[$a]:{primaries:t,whitePoint:i,transfer:Za,toXYZ:Zh,fromXYZ:Kh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:mi},outputColorSpaceConfig:{drawingBufferColorSpace:mi}},[mi]:{primaries:t,whitePoint:i,transfer:fe,toXYZ:Zh,fromXYZ:Kh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:mi}}}),a}const Kt=Du();function on(a){return a<.04045?a*.0773993808:Math.pow(a*.9478672986+.0521327014,2.4)}function cs(a){return a<.0031308?a*12.92:1.055*Math.pow(a,.41666)-.055}let qn;class Iu{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{qn===void 0&&(qn=Ka("canvas")),qn.width=t.width,qn.height=t.height;const n=qn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),i=qn}return i.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ka("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const n=i.getImageData(0,0,t.width,t.height),s=n.data;for(let r=0;r<s.length;r++)s[r]=on(s[r]/255)*255;return i.putImageData(n,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(on(e[i]/255)*255):e[i]=on(e[i]);return{data:e,width:t.width,height:t.height}}else return Bt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Nu=0;class vh{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Nu++}),this.uuid=gs(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let r=0,o=n.length;r<o;r++)n[r].isDataTexture?s.push(xr(n[r].image)):s.push(xr(n[r]))}else s=xr(n);i.url=s}return e||(t.images[this.uuid]=i),i}}function xr(a){return typeof HTMLImageElement<"u"&&a instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&a instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&a instanceof ImageBitmap?Iu.getDataURL(a):a.data?{data:Array.from(a.data),width:a.width,height:a.height,type:a.data.constructor.name}:(Bt("Texture: Unable to serialize Texture."),{})}let Uu=0;const yr=new C;class ii extends Hn{constructor(t=ii.DEFAULT_IMAGE,e=ii.DEFAULT_MAPPING,i=rn,n=rn,s=Qe,r=In,o=Ii,h=vi,l=ii.DEFAULT_ANISOTROPY,c=Mn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Uu++}),this.uuid=gs(),this.name="",this.source=new vh(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=s,this.minFilter=r,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=h,this.offset=new ht(0,0),this.repeat=new ht(1,1),this.center=new ht(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ht,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=c,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(yr).x}get height(){return this.source.getSize(yr).y}get depth(){return this.source.getSize(yr).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const i=t[e];if(i===void 0){Bt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const n=this[e];if(n===void 0){Bt(`Texture.setValues(): property '${e}' does not exist.`);continue}n&&i&&n.isVector2&&i.isVector2||n&&i&&n.isVector3&&i.isVector3||n&&i&&n.isMatrix3&&i.isMatrix3?n.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Nc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case po:t.x=t.x-Math.floor(t.x);break;case rn:t.x=t.x<0?0:1;break;case mo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case po:t.y=t.y-Math.floor(t.y);break;case rn:t.y=t.y<0?0:1;break;case mo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ii.DEFAULT_IMAGE=null;ii.DEFAULT_MAPPING=Nc;ii.DEFAULT_ANISOTROPY=1;class Re{static{Re.prototype.isVector4=!0}constructor(t=0,e=0,i=0,n=1){this.x=t,this.y=e,this.z=i,this.w=n}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,n){return this.x=t,this.y=e,this.z=i,this.w=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,n=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*n+r[12]*s,this.y=r[1]*e+r[5]*i+r[9]*n+r[13]*s,this.z=r[2]*e+r[6]*i+r[10]*n+r[14]*s,this.w=r[3]*e+r[7]*i+r[11]*n+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,n,s;const h=t.elements,l=h[0],c=h[4],u=h[8],d=h[1],f=h[5],m=h[9],v=h[2],p=h[6],g=h[10];if(Math.abs(c-d)<.01&&Math.abs(u-v)<.01&&Math.abs(m-p)<.01){if(Math.abs(c+d)<.1&&Math.abs(u+v)<.1&&Math.abs(m+p)<.1&&Math.abs(l+f+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const b=(l+1)/2,x=(f+1)/2,S=(g+1)/2,T=(c+d)/4,R=(u+v)/4,M=(m+p)/4;return b>x&&b>S?b<.01?(i=0,n=.707106781,s=.707106781):(i=Math.sqrt(b),n=T/i,s=R/i):x>S?x<.01?(i=.707106781,n=0,s=.707106781):(n=Math.sqrt(x),i=T/n,s=M/n):S<.01?(i=.707106781,n=.707106781,s=0):(s=Math.sqrt(S),i=R/s,n=M/s),this.set(i,n,s,e),this}let y=Math.sqrt((p-m)*(p-m)+(u-v)*(u-v)+(d-c)*(d-c));return Math.abs(y)<.001&&(y=1),this.x=(p-m)/y,this.y=(u-v)/y,this.z=(d-c)/y,this.w=Math.acos((l+f+g-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this.w=$t(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this.w=$t(this.w,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar($t(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Fu extends Hn{constructor(t=1,e=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Qe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=i.depth,this.scissor=new Re(0,0,t,e),this.scissorTest=!1,this.viewport=new Re(0,0,t,e),this.textures=[];const n={width:t,height:e,depth:i.depth},s=new ii(n),r=i.count;for(let o=0;o<r;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Qe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let n=0,s=this.textures.length;n<s;n++)this.textures[n].image.width=t,this.textures[n].image.height=e,this.textures[n].image.depth=i,this.textures[n].isData3DTexture!==!0&&(this.textures[n].isArrayTexture=this.textures[n].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,i=t.textures.length;e<i;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const n=Object.assign({},t.textures[e].image);this.textures[e].source=new vh(n)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ni extends Fu{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class Vc extends ii{constructor(t=null,e=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=Xe,this.minFilter=Xe,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class zu extends ii{constructor(t=null,e=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=Xe,this.minFilter=Xe,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}class pe{static{pe.prototype.isMatrix4=!0}constructor(t,e,i,n,s,r,o,h,l,c,u,d,f,m,v,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,n,s,r,o,h,l,c,u,d,f,m,v,p)}set(t,e,i,n,s,r,o,h,l,c,u,d,f,m,v,p){const g=this.elements;return g[0]=t,g[4]=e,g[8]=i,g[12]=n,g[1]=s,g[5]=r,g[9]=o,g[13]=h,g[2]=l,g[6]=c,g[10]=u,g[14]=d,g[3]=f,g[7]=m,g[11]=v,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new pe().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,i=t.elements,n=1/Yn.setFromMatrixColumn(t,0).length(),s=1/Yn.setFromMatrixColumn(t,1).length(),r=1/Yn.setFromMatrixColumn(t,2).length();return e[0]=i[0]*n,e[1]=i[1]*n,e[2]=i[2]*n,e[3]=0,e[4]=i[4]*s,e[5]=i[5]*s,e[6]=i[6]*s,e[7]=0,e[8]=i[8]*r,e[9]=i[9]*r,e[10]=i[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,n=t.y,s=t.z,r=Math.cos(i),o=Math.sin(i),h=Math.cos(n),l=Math.sin(n),c=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){const d=r*c,f=r*u,m=o*c,v=o*u;e[0]=h*c,e[4]=-h*u,e[8]=l,e[1]=f+m*l,e[5]=d-v*l,e[9]=-o*h,e[2]=v-d*l,e[6]=m+f*l,e[10]=r*h}else if(t.order==="YXZ"){const d=h*c,f=h*u,m=l*c,v=l*u;e[0]=d+v*o,e[4]=m*o-f,e[8]=r*l,e[1]=r*u,e[5]=r*c,e[9]=-o,e[2]=f*o-m,e[6]=v+d*o,e[10]=r*h}else if(t.order==="ZXY"){const d=h*c,f=h*u,m=l*c,v=l*u;e[0]=d-v*o,e[4]=-r*u,e[8]=m+f*o,e[1]=f+m*o,e[5]=r*c,e[9]=v-d*o,e[2]=-r*l,e[6]=o,e[10]=r*h}else if(t.order==="ZYX"){const d=r*c,f=r*u,m=o*c,v=o*u;e[0]=h*c,e[4]=m*l-f,e[8]=d*l+v,e[1]=h*u,e[5]=v*l+d,e[9]=f*l-m,e[2]=-l,e[6]=o*h,e[10]=r*h}else if(t.order==="YZX"){const d=r*h,f=r*l,m=o*h,v=o*l;e[0]=h*c,e[4]=v-d*u,e[8]=m*u+f,e[1]=u,e[5]=r*c,e[9]=-o*c,e[2]=-l*c,e[6]=f*u+m,e[10]=d-v*u}else if(t.order==="XZY"){const d=r*h,f=r*l,m=o*h,v=o*l;e[0]=h*c,e[4]=-u,e[8]=l*c,e[1]=d*u+v,e[5]=r*c,e[9]=f*u-m,e[2]=m*u-f,e[6]=o*c,e[10]=v*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Bu,t,Ou)}lookAt(t,e,i){const n=this.elements;return di.subVectors(t,e),di.lengthSq()===0&&(di.z=1),di.normalize(),pn.crossVectors(i,di),pn.lengthSq()===0&&(Math.abs(i.z)===1?di.x+=1e-4:di.z+=1e-4,di.normalize(),pn.crossVectors(i,di)),pn.normalize(),aa.crossVectors(di,pn),n[0]=pn.x,n[4]=aa.x,n[8]=di.x,n[1]=pn.y,n[5]=aa.y,n[9]=di.y,n[2]=pn.z,n[6]=aa.z,n[10]=di.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,n=e.elements,s=this.elements,r=i[0],o=i[4],h=i[8],l=i[12],c=i[1],u=i[5],d=i[9],f=i[13],m=i[2],v=i[6],p=i[10],g=i[14],y=i[3],b=i[7],x=i[11],S=i[15],T=n[0],R=n[4],M=n[8],E=n[12],L=n[1],N=n[5],k=n[9],D=n[13],I=n[2],P=n[6],B=n[10],O=n[14],j=n[3],q=n[7],tt=n[11],it=n[15];return s[0]=r*T+o*L+h*I+l*j,s[4]=r*R+o*N+h*P+l*q,s[8]=r*M+o*k+h*B+l*tt,s[12]=r*E+o*D+h*O+l*it,s[1]=c*T+u*L+d*I+f*j,s[5]=c*R+u*N+d*P+f*q,s[9]=c*M+u*k+d*B+f*tt,s[13]=c*E+u*D+d*O+f*it,s[2]=m*T+v*L+p*I+g*j,s[6]=m*R+v*N+p*P+g*q,s[10]=m*M+v*k+p*B+g*tt,s[14]=m*E+v*D+p*O+g*it,s[3]=y*T+b*L+x*I+S*j,s[7]=y*R+b*N+x*P+S*q,s[11]=y*M+b*k+x*B+S*tt,s[15]=y*E+b*D+x*O+S*it,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],n=t[8],s=t[12],r=t[1],o=t[5],h=t[9],l=t[13],c=t[2],u=t[6],d=t[10],f=t[14],m=t[3],v=t[7],p=t[11],g=t[15],y=h*f-l*d,b=o*f-l*u,x=o*d-h*u,S=r*f-l*c,T=r*d-h*c,R=r*u-o*c;return e*(v*y-p*b+g*x)-i*(m*y-p*S+g*T)+n*(m*b-v*S+g*R)-s*(m*x-v*T+p*R)}determinantAffine(){const t=this.elements,e=t[0],i=t[4],n=t[8],s=t[1],r=t[5],o=t[9],h=t[2],l=t[6],c=t[10];return e*(r*c-o*l)-i*(s*c-o*h)+n*(s*l-r*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const n=this.elements;return t.isVector3?(n[12]=t.x,n[13]=t.y,n[14]=t.z):(n[12]=t,n[13]=e,n[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],n=t[2],s=t[3],r=t[4],o=t[5],h=t[6],l=t[7],c=t[8],u=t[9],d=t[10],f=t[11],m=t[12],v=t[13],p=t[14],g=t[15],y=e*o-i*r,b=e*h-n*r,x=e*l-s*r,S=i*h-n*o,T=i*l-s*o,R=n*l-s*h,M=c*v-u*m,E=c*p-d*m,L=c*g-f*m,N=u*p-d*v,k=u*g-f*v,D=d*g-f*p,I=y*D-b*k+x*N+S*L-T*E+R*M;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const P=1/I;return t[0]=(o*D-h*k+l*N)*P,t[1]=(n*k-i*D-s*N)*P,t[2]=(v*R-p*T+g*S)*P,t[3]=(d*T-u*R-f*S)*P,t[4]=(h*L-r*D-l*E)*P,t[5]=(e*D-n*L+s*E)*P,t[6]=(p*x-m*R-g*b)*P,t[7]=(c*R-d*x+f*b)*P,t[8]=(r*k-o*L+l*M)*P,t[9]=(i*L-e*k-s*M)*P,t[10]=(m*T-v*x+g*y)*P,t[11]=(u*x-c*T-f*y)*P,t[12]=(o*E-r*N-h*M)*P,t[13]=(e*N-i*E+n*M)*P,t[14]=(v*b-m*S-p*y)*P,t[15]=(c*S-u*b+d*y)*P,this}scale(t){const e=this.elements,i=t.x,n=t.y,s=t.z;return e[0]*=i,e[4]*=n,e[8]*=s,e[1]*=i,e[5]*=n,e[9]*=s,e[2]*=i,e[6]*=n,e[10]*=s,e[3]*=i,e[7]*=n,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,n))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),n=Math.sin(e),s=1-i,r=t.x,o=t.y,h=t.z,l=s*r,c=s*o;return this.set(l*r+i,l*o-n*h,l*h+n*o,0,l*o+n*h,c*o+i,c*h-n*r,0,l*h-n*o,c*h+n*r,s*h*h+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,n,s,r){return this.set(1,i,s,0,t,1,r,0,e,n,1,0,0,0,0,1),this}compose(t,e,i){const n=this.elements,s=e._x,r=e._y,o=e._z,h=e._w,l=s+s,c=r+r,u=o+o,d=s*l,f=s*c,m=s*u,v=r*c,p=r*u,g=o*u,y=h*l,b=h*c,x=h*u,S=i.x,T=i.y,R=i.z;return n[0]=(1-(v+g))*S,n[1]=(f+x)*S,n[2]=(m-b)*S,n[3]=0,n[4]=(f-x)*T,n[5]=(1-(d+g))*T,n[6]=(p+y)*T,n[7]=0,n[8]=(m+b)*R,n[9]=(p-y)*R,n[10]=(1-(d+v))*R,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this}decompose(t,e,i){const n=this.elements;t.x=n[12],t.y=n[13],t.z=n[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),e.identity(),this;let r=Yn.set(n[0],n[1],n[2]).length();const o=Yn.set(n[4],n[5],n[6]).length(),h=Yn.set(n[8],n[9],n[10]).length();s<0&&(r=-r),Ei.copy(this);const l=1/r,c=1/o,u=1/h;return Ei.elements[0]*=l,Ei.elements[1]*=l,Ei.elements[2]*=l,Ei.elements[4]*=c,Ei.elements[5]*=c,Ei.elements[6]*=c,Ei.elements[8]*=u,Ei.elements[9]*=u,Ei.elements[10]*=u,e.setFromRotationMatrix(Ei),i.x=r,i.y=o,i.z=h,this}makePerspective(t,e,i,n,s,r,o=Wi,h=!1){const l=this.elements,c=2*s/(e-t),u=2*s/(i-n),d=(e+t)/(e-t),f=(i+n)/(i-n);let m,v;if(h)m=s/(r-s),v=r*s/(r-s);else if(o===Wi)m=-(r+s)/(r-s),v=-2*r*s/(r-s);else if(o===Ys)m=-r/(r-s),v=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,n,s,r,o=Wi,h=!1){const l=this.elements,c=2/(e-t),u=2/(i-n),d=-(e+t)/(e-t),f=-(i+n)/(i-n);let m,v;if(h)m=1/(r-s),v=r/(r-s);else if(o===Wi)m=-2/(r-s),v=-(r+s)/(r-s);else if(o===Ys)m=-1/(r-s),v=-s/(r-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=u,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=m,l[14]=v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let n=0;n<16;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const Yn=new C,Ei=new pe,Bu=new C(0,0,0),Ou=new C(1,1,1),pn=new C,aa=new C,di=new C,Jh=new pe,Qh=new Gn;class ln{constructor(t=0,e=0,i=0,n=ln.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=n}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,n=this._order){return this._x=t,this._y=e,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const n=t.elements,s=n[0],r=n[4],o=n[8],h=n[1],l=n[5],c=n[9],u=n[2],d=n[6],f=n[10];switch(e){case"XYZ":this._y=Math.asin($t(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,f),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-$t(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(h,l)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin($t(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-r,l)):(this._y=0,this._z=Math.atan2(h,s));break;case"ZYX":this._y=Math.asin(-$t(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(h,s)):(this._x=0,this._z=Math.atan2(-r,l));break;case"YZX":this._z=Math.asin($t(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(-c,l),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-$t(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-c,f),this._y=0);break;default:Bt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Jh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Jh,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Qh.setFromEuler(this),this.setFromQuaternion(Qh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ln.DEFAULT_ORDER="XYZ";class Wc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Hu=0;const jh=new C,$n=new Gn,Qi=new pe,ra=new C,Ss=new C,Gu=new C,Vu=new Gn,tl=new C(1,0,0),el=new C(0,1,0),il=new C(0,0,1),nl={type:"added"},Wu={type:"removed"},Zn={type:"childadded",child:null},_r={type:"childremoved",child:null};class Le extends Hn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hu++}),this.uuid=gs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Le.DEFAULT_UP.clone();const t=new C,e=new ln,i=new Gn,n=new C(1,1,1);function s(){i.setFromEuler(e,!1)}function r(){e.setFromQuaternion(i,void 0,!1)}e._onChange(s),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new pe},normalMatrix:{value:new Ht}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=Le.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return $n.setFromAxisAngle(t,e),this.quaternion.multiply($n),this}rotateOnWorldAxis(t,e){return $n.setFromAxisAngle(t,e),this.quaternion.premultiply($n),this}rotateX(t){return this.rotateOnAxis(tl,t)}rotateY(t){return this.rotateOnAxis(el,t)}rotateZ(t){return this.rotateOnAxis(il,t)}translateOnAxis(t,e){return jh.copy(t).applyQuaternion(this.quaternion),this.position.add(jh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(tl,t)}translateY(t){return this.translateOnAxis(el,t)}translateZ(t){return this.translateOnAxis(il,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Qi.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?ra.copy(t):ra.set(t,e,i);const n=this.parent;this.updateWorldMatrix(!0,!1),Ss.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qi.lookAt(Ss,ra,this.up):Qi.lookAt(ra,Ss,this.up),this.quaternion.setFromRotationMatrix(Qi),n&&(Qi.extractRotation(n.matrixWorld),$n.setFromRotationMatrix(Qi),this.quaternion.premultiply($n.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(re("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(nl),Zn.child=t,this.dispatchEvent(Zn),Zn.child=null):re("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Wu),_r.child=t,this.dispatchEvent(_r),_r.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Qi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Qi.multiply(t.parent.matrixWorld)),t.applyMatrix4(Qi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(nl),Zn.child=t,this.dispatchEvent(Zn),Zn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,n=this.children.length;i<n;i++){const r=this.children[i].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const n=this.children;for(let s=0,r=n.length;s<r;s++)n[s].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ss,t,Gu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ss,Vu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,i=t.y,n=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*i-s[8]*n,s[13]+=i-s[1]*e-s[5]*i-s[9]*n,s[14]+=n-s[2]*e-s[6]*i-s[10]*n}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e,i=!1){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0,i)}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,n.name=this.name,n.castShadow=this.castShadow,n.receiveShadow=this.receiveShadow,n.visible=this.visible,n.frustumCulled=this.frustumCulled,n.renderOrder=this.renderOrder,n.static=this.static,n.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.pivot!==null&&(n.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(n.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(n.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),n.instanceInfo=this._instanceInfo.map(o=>({...o})),n.availableInstanceIds=this._availableInstanceIds.slice(),n.availableGeometryIds=this._availableGeometryIds.slice(),n.nextIndexStart=this._nextIndexStart,n.nextVertexStart=this._nextVertexStart,n.geometryCount=this._geometryCount,n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.matricesTexture=this._matricesTexture.toJSON(t),n.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(n.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(n.boundingBox=this.boundingBox.toJSON()));function s(o,h){return o[h.uuid]===void 0&&(o[h.uuid]=h.toJSON(t)),h.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const h=o.shapes;if(Array.isArray(h))for(let l=0,c=h.length;l<c;l++){const u=h[l];s(t.shapes,u)}else s(t.shapes,h)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let h=0,l=this.material.length;h<l;h++)o.push(s(t.materials,this.material[h]));n.material=o}else n.material=s(t.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){const h=this.animations[o];n.animations.push(s(t.animations,h))}}if(e){const o=r(t.geometries),h=r(t.materials),l=r(t.textures),c=r(t.images),u=r(t.shapes),d=r(t.skeletons),f=r(t.animations),m=r(t.nodes);o.length>0&&(i.geometries=o),h.length>0&&(i.materials=h),l.length>0&&(i.textures=l),c.length>0&&(i.images=c),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),m.length>0&&(i.nodes=m)}return i.object=n,i;function r(o){const h=[];for(const l in o){const c=o[l];delete c.metadata,h.push(c)}return h}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const n=t.children[i];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Le.DEFAULT_UP=new C(0,1,0);Le.DEFAULT_MATRIX_AUTO_UPDATE=!0;Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class kt extends Le{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Xu={type:"move"};class Mr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new kt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new kt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new kt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let n=null,s=null,r=null;const o=this._targetRay,h=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){r=!0;for(const v of t.hand.values()){const p=e.getJointPose(v,i),g=this._getHandJoint(l,v);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}const c=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=c.position.distanceTo(u.position),f=.02,m=.005;l.inputState.pinching&&d>f+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&d<=f-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else h!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,i),s!==null&&(h.matrix.fromArray(s.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,s.linearVelocity?(h.hasLinearVelocity=!0,h.linearVelocity.copy(s.linearVelocity)):h.hasLinearVelocity=!1,s.angularVelocity?(h.hasAngularVelocity=!0,h.angularVelocity.copy(s.angularVelocity)):h.hasAngularVelocity=!1,h.eventsEnabled&&h.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(n=e.getPose(t.targetRaySpace,i),n===null&&s!==null&&(n=s),n!==null&&(o.matrix.fromArray(n.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,n.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(n.linearVelocity)):o.hasLinearVelocity=!1,n.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(n.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Xu)))}return o!==null&&(o.visible=n!==null),h!==null&&(h.visible=s!==null),l!==null&&(l.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new kt;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}const Xc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},mn={h:0,s:0,l:0},oa={h:0,s:0,l:0};function wr(a,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?a+(t-a)*6*e:e<1/2?t:e<2/3?a+(t-a)*6*(2/3-e):a}class Nt{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const n=t;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=mi){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.colorSpaceToWorking(this,e),this}setRGB(t,e,i,n=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=i,Kt.colorSpaceToWorking(this,n),this}setHSL(t,e,i,n=Kt.workingColorSpace){if(t=Lu(t,1),e=$t(e,0,1),i=$t(i,0,1),e===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+e):i+e-i*e,r=2*i-s;this.r=wr(r,s,t+1/3),this.g=wr(r,s,t),this.b=wr(r,s,t-1/3)}return Kt.colorSpaceToWorking(this,n),this}setStyle(t,e=mi){function i(s){s!==void 0&&parseFloat(s)<1&&Bt("Color: Alpha component of "+t+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const r=n[1],o=n[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Bt("Color: Unknown color model "+t)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=n[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);Bt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=mi){const i=Xc[t.toLowerCase()];return i!==void 0?this.setHex(i,e):Bt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=on(t.r),this.g=on(t.g),this.b=on(t.b),this}copyLinearToSRGB(t){return this.r=cs(t.r),this.g=cs(t.g),this.b=cs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=mi){return Kt.workingToColorSpace(Ke.copy(this),t),Math.round($t(Ke.r*255,0,255))*65536+Math.round($t(Ke.g*255,0,255))*256+Math.round($t(Ke.b*255,0,255))}getHexString(t=mi){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.workingToColorSpace(Ke.copy(this),e);const i=Ke.r,n=Ke.g,s=Ke.b,r=Math.max(i,n,s),o=Math.min(i,n,s);let h,l;const c=(o+r)/2;if(o===r)h=0,l=0;else{const u=r-o;switch(l=c<=.5?u/(r+o):u/(2-r-o),r){case i:h=(n-s)/u+(n<s?6:0);break;case n:h=(s-i)/u+2;break;case s:h=(i-n)/u+4;break}h/=6}return t.h=h,t.s=l,t.l=c,t}getRGB(t,e=Kt.workingColorSpace){return Kt.workingToColorSpace(Ke.copy(this),e),t.r=Ke.r,t.g=Ke.g,t.b=Ke.b,t}getStyle(t=mi){Kt.workingToColorSpace(Ke.copy(this),t);const e=Ke.r,i=Ke.g,n=Ke.b;return t!==mi?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(t,e,i){return this.getHSL(mn),this.setHSL(mn.h+t,mn.s+e,mn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(mn),t.getHSL(oa);const i=mr(mn.h,oa.h,e),n=mr(mn.s,oa.s,e),s=mr(mn.l,oa.l,e);return this.setHSL(i,n,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,n=this.b,s=t.elements;return this.r=s[0]*e+s[3]*i+s[6]*n,this.g=s[1]*e+s[4]*i+s[7]*n,this.b=s[2]*e+s[5]*i+s[8]*n,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ke=new Nt;Nt.NAMES=Xc;class xh{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new Nt(t),this.near=e,this.far=i}clone(){return new xh(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class qu extends Le{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Ai=new C,ji=new C,br=new C,tn=new C,Kn=new C,Jn=new C,sl=new C,Sr=new C,Tr=new C,Er=new C,Ar=new Re,Rr=new Re,Cr=new Re;class Li{constructor(t=new C,e=new C,i=new C){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,n){n.subVectors(i,e),Ai.subVectors(t,e),n.cross(Ai);const s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(t,e,i,n,s){Ai.subVectors(n,e),ji.subVectors(i,e),br.subVectors(t,e);const r=Ai.dot(Ai),o=Ai.dot(ji),h=Ai.dot(br),l=ji.dot(ji),c=ji.dot(br),u=r*l-o*o;if(u===0)return s.set(0,0,0),null;const d=1/u,f=(l*h-o*c)*d,m=(r*c-o*h)*d;return s.set(1-f-m,m,f)}static containsPoint(t,e,i,n){return this.getBarycoord(t,e,i,n,tn)===null?!1:tn.x>=0&&tn.y>=0&&tn.x+tn.y<=1}static getInterpolation(t,e,i,n,s,r,o,h){return this.getBarycoord(t,e,i,n,tn)===null?(h.x=0,h.y=0,"z"in h&&(h.z=0),"w"in h&&(h.w=0),null):(h.setScalar(0),h.addScaledVector(s,tn.x),h.addScaledVector(r,tn.y),h.addScaledVector(o,tn.z),h)}static getInterpolatedAttribute(t,e,i,n,s,r){return Ar.setScalar(0),Rr.setScalar(0),Cr.setScalar(0),Ar.fromBufferAttribute(t,e),Rr.fromBufferAttribute(t,i),Cr.fromBufferAttribute(t,n),r.setScalar(0),r.addScaledVector(Ar,s.x),r.addScaledVector(Rr,s.y),r.addScaledVector(Cr,s.z),r}static isFrontFacing(t,e,i,n){return Ai.subVectors(i,e),ji.subVectors(t,e),Ai.cross(ji).dot(n)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,n){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[n]),this}setFromAttributeAndIndices(t,e,i,n){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ai.subVectors(this.c,this.b),ji.subVectors(this.a,this.b),Ai.cross(ji).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Li.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Li.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,n,s){return Li.getInterpolation(t,this.a,this.b,this.c,e,i,n,s)}containsPoint(t){return Li.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Li.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,n=this.b,s=this.c;let r,o;Kn.subVectors(n,i),Jn.subVectors(s,i),Sr.subVectors(t,i);const h=Kn.dot(Sr),l=Jn.dot(Sr);if(h<=0&&l<=0)return e.copy(i);Tr.subVectors(t,n);const c=Kn.dot(Tr),u=Jn.dot(Tr);if(c>=0&&u<=c)return e.copy(n);const d=h*u-c*l;if(d<=0&&h>=0&&c<=0)return r=h/(h-c),e.copy(i).addScaledVector(Kn,r);Er.subVectors(t,s);const f=Kn.dot(Er),m=Jn.dot(Er);if(m>=0&&f<=m)return e.copy(s);const v=f*l-h*m;if(v<=0&&l>=0&&m<=0)return o=l/(l-m),e.copy(i).addScaledVector(Jn,o);const p=c*m-f*u;if(p<=0&&u-c>=0&&f-m>=0)return sl.subVectors(s,n),o=(u-c)/(u-c+(f-m)),e.copy(n).addScaledVector(sl,o);const g=1/(p+v+d);return r=v*g,o=d*g,e.copy(i).addScaledVector(Kn,r).addScaledVector(Jn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Vn{constructor(t=new C(1/0,1/0,1/0),e=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Ri.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Ri.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=Ri.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const s=i.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,Ri):Ri.fromBufferAttribute(s,r),Ri.applyMatrix4(t.matrixWorld),this.expandByPoint(Ri);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ha.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ha.copy(i.boundingBox)),ha.applyMatrix4(t.matrixWorld),this.union(ha)}const n=t.children;for(let s=0,r=n.length;s<r;s++)this.expandByObject(n[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ri),Ri.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ts),la.subVectors(this.max,Ts),Qn.subVectors(t.a,Ts),jn.subVectors(t.b,Ts),ts.subVectors(t.c,Ts),gn.subVectors(jn,Qn),vn.subVectors(ts,jn),An.subVectors(Qn,ts);let e=[0,-gn.z,gn.y,0,-vn.z,vn.y,0,-An.z,An.y,gn.z,0,-gn.x,vn.z,0,-vn.x,An.z,0,-An.x,-gn.y,gn.x,0,-vn.y,vn.x,0,-An.y,An.x,0];return!Pr(e,Qn,jn,ts,la)||(e=[1,0,0,0,1,0,0,0,1],!Pr(e,Qn,jn,ts,la))?!1:(ca.crossVectors(gn,vn),e=[ca.x,ca.y,ca.z],Pr(e,Qn,jn,ts,la))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ri).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ri).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(en[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),en[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),en[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),en[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),en[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),en[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),en[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),en[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(en),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const en=[new C,new C,new C,new C,new C,new C,new C,new C],Ri=new C,ha=new Vn,Qn=new C,jn=new C,ts=new C,gn=new C,vn=new C,An=new C,Ts=new C,la=new C,ca=new C,Rn=new C;function Pr(a,t,e,i,n){for(let s=0,r=a.length-3;s<=r;s+=3){Rn.fromArray(a,s);const o=n.x*Math.abs(Rn.x)+n.y*Math.abs(Rn.y)+n.z*Math.abs(Rn.z),h=t.dot(Rn),l=e.dot(Rn),c=i.dot(Rn);if(Math.max(-Math.max(h,l,c),Math.min(h,l,c))>o)return!1}return!0}const Ue=new C,da=new ht;let Yu=0;class qe extends Hn{constructor(t,e,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Yu++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Au,this.updateRanges=[],this.gpuType=Di,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[t+n]=e.array[i+n];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)da.fromBufferAttribute(this,e),da.applyMatrix3(t),this.setXY(e,da.x,da.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix3(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix4(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Ue.fromBufferAttribute(this,e),Ue.applyNormalMatrix(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Ue.fromBufferAttribute(this,e),Ue.transformDirection(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=bs(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=ri(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=bs(e,this.array)),e}setX(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=bs(e,this.array)),e}setY(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=bs(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=bs(e,this.array)),e}setW(t,e){return this.normalized&&(e=ri(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,n){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array),n=ri(n,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this}setXYZW(t,e,i,n,s){return t*=this.itemSize,this.normalized&&(e=ri(e,this.array),i=ri(i,this.array),n=ri(n,this.array),s=ri(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class qc extends qe{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class Yc extends qe{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Jt extends qe{constructor(t,e,i){super(new Float32Array(t),e,i)}}const $u=new Vn,Es=new C,kr=new C;class vs{constructor(t=new C,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):$u.setFromPoints(t).getCenter(i);let n=0;for(let s=0,r=t.length;s<r;s++)n=Math.max(n,i.distanceToSquared(t[s]));return this.radius=Math.sqrt(n),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Es.subVectors(t,this.center);const e=Es.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),n=(i-this.radius)*.5;this.center.addScaledVector(Es,n/i),this.radius+=n}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(kr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Es.copy(t.center).add(kr)),this.expandByPoint(Es.copy(t.center).sub(kr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Zu=0;const Mi=new pe,Lr=new Le,es=new C,ui=new Vn,As=new Vn,Ve=new C;class Se extends Hn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Zu++}),this.uuid=gs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Ru(t)?Yc:qc)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ht().getNormalMatrix(t);i.applyNormalMatrix(s),i.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(t),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Mi.makeRotationFromQuaternion(t),this.applyMatrix4(Mi),this}rotateX(t){return Mi.makeRotationX(t),this.applyMatrix4(Mi),this}rotateY(t){return Mi.makeRotationY(t),this.applyMatrix4(Mi),this}rotateZ(t){return Mi.makeRotationZ(t),this.applyMatrix4(Mi),this}translate(t,e,i){return Mi.makeTranslation(t,e,i),this.applyMatrix4(Mi),this}scale(t,e,i){return Mi.makeScale(t,e,i),this.applyMatrix4(Mi),this}lookAt(t){return Lr.lookAt(t),Lr.updateMatrix(),this.applyMatrix4(Lr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(es).negate(),this.translate(es.x,es.y,es.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const i=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];i.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Jt(i,3))}else{const i=Math.min(t.length,e.count);for(let n=0;n<i;n++){const s=t[n];e.setXYZ(n,s.x,s.y,s.z||0)}t.length>e.count&&Bt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Vn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,n=e.length;i<n;i++){const s=e[i];ui.setFromBufferAttribute(s),this.morphTargetsRelative?(Ve.addVectors(this.boundingBox.min,ui.min),this.boundingBox.expandByPoint(Ve),Ve.addVectors(this.boundingBox.max,ui.max),this.boundingBox.expandByPoint(Ve)):(this.boundingBox.expandByPoint(ui.min),this.boundingBox.expandByPoint(ui.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new vs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(t){const i=this.boundingSphere.center;if(ui.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){const o=e[s];As.setFromBufferAttribute(o),this.morphTargetsRelative?(Ve.addVectors(ui.min,As.min),ui.expandByPoint(Ve),Ve.addVectors(ui.max,As.max),ui.expandByPoint(Ve)):(ui.expandByPoint(As.min),ui.expandByPoint(As.max))}ui.getCenter(i);let n=0;for(let s=0,r=t.count;s<r;s++)Ve.fromBufferAttribute(t,s),n=Math.max(n,i.distanceToSquared(Ve));if(e)for(let s=0,r=e.length;s<r;s++){const o=e[s],h=this.morphTargetsRelative;for(let l=0,c=o.count;l<c;l++)Ve.fromBufferAttribute(o,l),h&&(es.fromBufferAttribute(t,l),Ve.add(es)),n=Math.max(n,i.distanceToSquared(Ve))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.position,n=e.normal,s=e.uv;let r=this.getAttribute("tangent");(r===void 0||r.count!==i.count)&&(r=new qe(new Float32Array(4*i.count),4),this.setAttribute("tangent",r));const o=[],h=[];for(let M=0;M<i.count;M++)o[M]=new C,h[M]=new C;const l=new C,c=new C,u=new C,d=new ht,f=new ht,m=new ht,v=new C,p=new C;function g(M,E,L){l.fromBufferAttribute(i,M),c.fromBufferAttribute(i,E),u.fromBufferAttribute(i,L),d.fromBufferAttribute(s,M),f.fromBufferAttribute(s,E),m.fromBufferAttribute(s,L),c.sub(l),u.sub(l),f.sub(d),m.sub(d);const N=1/(f.x*m.y-m.x*f.y);isFinite(N)&&(v.copy(c).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(N),p.copy(u).multiplyScalar(f.x).addScaledVector(c,-m.x).multiplyScalar(N),o[M].add(v),o[E].add(v),o[L].add(v),h[M].add(p),h[E].add(p),h[L].add(p))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let M=0,E=y.length;M<E;++M){const L=y[M],N=L.start,k=L.count;for(let D=N,I=N+k;D<I;D+=3)g(t.getX(D+0),t.getX(D+1),t.getX(D+2))}const b=new C,x=new C,S=new C,T=new C;function R(M){S.fromBufferAttribute(n,M),T.copy(S);const E=o[M];b.copy(E),b.sub(S.multiplyScalar(S.dot(E))).normalize(),x.crossVectors(T,E);const N=x.dot(h[M])<0?-1:1;r.setXYZW(M,b.x,b.y,b.z,N)}for(let M=0,E=y.length;M<E;++M){const L=y[M],N=L.start,k=L.count;for(let D=N,I=N+k;D<I;D+=3)R(t.getX(D+0)),R(t.getX(D+1)),R(t.getX(D+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==e.count)i=new qe(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);const n=new C,s=new C,r=new C,o=new C,h=new C,l=new C,c=new C,u=new C;if(t)for(let d=0,f=t.count;d<f;d+=3){const m=t.getX(d+0),v=t.getX(d+1),p=t.getX(d+2);n.fromBufferAttribute(e,m),s.fromBufferAttribute(e,v),r.fromBufferAttribute(e,p),c.subVectors(r,s),u.subVectors(n,s),c.cross(u),o.fromBufferAttribute(i,m),h.fromBufferAttribute(i,v),l.fromBufferAttribute(i,p),o.add(c),h.add(c),l.add(c),i.setXYZ(m,o.x,o.y,o.z),i.setXYZ(v,h.x,h.y,h.z),i.setXYZ(p,l.x,l.y,l.z)}else for(let d=0,f=e.count;d<f;d+=3)n.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),r.fromBufferAttribute(e,d+2),c.subVectors(r,s),u.subVectors(n,s),c.cross(u),i.setXYZ(d+0,c.x,c.y,c.z),i.setXYZ(d+1,c.x,c.y,c.z),i.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ve.fromBufferAttribute(t,e),Ve.normalize(),t.setXYZ(e,Ve.x,Ve.y,Ve.z)}toNonIndexed(){function t(o,h){const l=o.array,c=o.itemSize,u=o.normalized,d=new l.constructor(h.length*c);let f=0,m=0;for(let v=0,p=h.length;v<p;v++){o.isInterleavedBufferAttribute?f=h[v]*o.data.stride+o.offset:f=h[v]*c;for(let g=0;g<c;g++)d[m++]=l[f++]}return new qe(d,c,u)}if(this.index===null)return Bt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Se,i=this.index.array,n=this.attributes;for(const o in n){const h=n[o],l=t(h,i);e.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const h=[],l=s[o];for(let c=0,u=l.length;c<u;c++){const d=l[c],f=t(d,i);h.push(f)}e.morphAttributes[o]=h}e.morphTargetsRelative=this.morphTargetsRelative;const r=this.groups;for(let o=0,h=r.length;o<h;o++){const l=r[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const h=this.parameters;for(const l in h)h[l]!==void 0&&(t[l]=h[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const h in i){const l=i[h];t.data.attributes[h]=l.toJSON(t.data)}const n={};let s=!1;for(const h in this.morphAttributes){const l=this.morphAttributes[h],c=[];for(let u=0,d=l.length;u<d;u++){const f=l[u];c.push(f.toJSON(t.data))}c.length>0&&(n[h]=c,s=!0)}s&&(t.data.morphAttributes=n,t.data.morphTargetsRelative=this.morphTargetsRelative);const r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const n=t.attributes;for(const l in n){const c=n[l];this.setAttribute(l,c.clone(e))}const s=t.morphAttributes;for(const l in s){const c=[],u=s[l];for(let d=0,f=u.length;d<f;d++)c.push(u[d].clone(e));this.morphAttributes[l]=c}this.morphTargetsRelative=t.morphTargetsRelative;const r=t.groups;for(let l=0,c=r.length;l<c;l++){const u=r[l];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const h=t.boundingSphere;return h!==null&&(this.boundingSphere=h.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Dr=new C,Ku=new C,Ju=new Ht;class _n{constructor(t=new C(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,n){return this.normal.set(t,e,i),this.constant=n,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const n=Dr.subVectors(i,e).cross(Ku.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(n,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,i=!0){const n=t.delta(Dr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return i===!0&&(r<0||r>1)?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||Ju.getNormalMatrix(t),n=this.coplanarPoint(Dr).applyMatrix4(t),s=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let Qu=0;class xs extends Hn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Qu++}),this.uuid=gs(),this.name="",this.type="Material",this.blending=Un,this.side=Sn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Lc,this.blendDst=Dc,this.blendEquation=os,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Nt(0,0,0),this.blendAlpha=0,this.depthFunc=Ws,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=_u,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ur,this.stencilZFail=ur,this.stencilZPass=ur,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){Bt(`Material: parameter '${e}' has value of undefined.`);continue}const n=this[e];if(n===void 0){Bt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector2&&i&&i.isVector2||n&&n.isEuler&&i&&i.isEuler||n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(s){const r=[];for(const o in s){const h=s[o];delete h.metadata,r.push(h)}return r}if(e){const s=n(t.textures),r=n(t.images);s.length>0&&(i.textures=s),r.length>0&&(i.images=r)}return i}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Nt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new _n().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ht().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ht().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const n=e.length;i=new Array(n);for(let s=0;s!==n;++s)i[s]=e[s].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const nn=new C,Ir=new C,ua=new C,fa=new C;class $c{constructor(t=new C,e=new C(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,nn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=nn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(nn.copy(this.origin).addScaledVector(this.direction,e),nn.distanceToSquared(t))}distanceSqToSegment(t,e,i,n){Ir.copy(t).add(e).multiplyScalar(.5),ua.copy(e).sub(t).normalize(),fa.copy(this.origin).sub(Ir);const s=t.distanceTo(e)*.5,r=-this.direction.dot(ua),o=fa.dot(this.direction),h=-fa.dot(ua),l=fa.lengthSq(),c=Math.abs(1-r*r);let u,d,f,m;if(c>0)if(u=r*h-o,d=r*o-h,m=s*c,u>=0)if(d>=-m)if(d<=m){const v=1/c;u*=v,d*=v,f=u*(u+r*d+2*o)+d*(r*u+d+2*h)+l}else d=s,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*h)+l;else d=-s,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*h)+l;else d<=-m?(u=Math.max(0,-(-r*s+o)),d=u>0?-s:Math.min(Math.max(-s,-h),s),f=-u*u+d*(d+2*h)+l):d<=m?(u=0,d=Math.min(Math.max(-s,-h),s),f=d*(d+2*h)+l):(u=Math.max(0,-(r*s+o)),d=u>0?s:Math.min(Math.max(-s,-h),s),f=-u*u+d*(d+2*h)+l);else d=r>0?-s:s,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*h)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(Ir).addScaledVector(ua,d),f}intersectSphere(t,e){if(t.radius<0)return null;nn.subVectors(t.center,this.origin);const i=nn.dot(this.direction),n=nn.dot(nn)-i*i,s=t.radius*t.radius;if(n>s)return null;const r=Math.sqrt(s-n),o=i-r,h=i+r;return h<0?null:o<0?this.at(h,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,n,s,r,o,h;const l=1/this.direction.x,c=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(i=(t.min.x-d.x)*l,n=(t.max.x-d.x)*l):(i=(t.max.x-d.x)*l,n=(t.min.x-d.x)*l),c>=0?(s=(t.min.y-d.y)*c,r=(t.max.y-d.y)*c):(s=(t.max.y-d.y)*c,r=(t.min.y-d.y)*c),i>r||s>n||((s>i||isNaN(i))&&(i=s),(r<n||isNaN(n))&&(n=r),u>=0?(o=(t.min.z-d.z)*u,h=(t.max.z-d.z)*u):(o=(t.max.z-d.z)*u,h=(t.min.z-d.z)*u),i>h||o>n)||((o>i||i!==i)&&(i=o),(h<n||n!==n)&&(n=h),n<0)?null:this.at(i>=0?i:n,e)}intersectsBox(t){return this.intersectBox(t,nn)!==null}intersectTriangle(t,e,i,n,s){const r=this.origin,o=this.direction,h=o.x,l=o.y,c=o.z,u=t.x-r.x,d=t.y-r.y,f=t.z-r.z,m=e.x-r.x,v=e.y-r.y,p=e.z-r.z,g=i.x-r.x,y=i.y-r.y,b=i.z-r.z,x=Math.abs(h),S=Math.abs(l),T=Math.abs(c);let R,M,E,L,N,k,D,I,P,B,O,j;if(x>=S&&x>=T?(E=h,k=u,P=m,j=g,h>=0?(R=l,M=c,L=d,N=f,D=v,I=p,B=y,O=b):(R=c,M=l,L=f,N=d,D=p,I=v,B=b,O=y)):S>=T?(E=l,k=d,P=v,j=y,l>=0?(R=c,M=h,L=f,N=u,D=p,I=m,B=b,O=g):(R=h,M=c,L=u,N=f,D=m,I=p,B=g,O=b)):(E=c,k=f,P=p,j=b,c>=0?(R=h,M=l,L=u,N=d,D=m,I=v,B=g,O=y):(R=l,M=h,L=d,N=u,D=v,I=m,B=y,O=g)),E===0)return null;const q=R/E,tt=M/E,it=1/E,It=L-q*k,Tt=N-tt*k,ce=D-q*P,Qt=I-tt*P,oe=B-q*j,$=O-tt*j,et=oe*Qt-$*ce,wt=It*$-Tt*oe,Ot=ce*Tt-Qt*It;if(n){if(et<0||wt<0||Ot<0)return null}else if((et<0||wt<0||Ot<0)&&(et>0||wt>0||Ot>0))return null;const _t=et+wt+Ot;if(_t===0)return null;const Xt=it*(et*k+wt*P+Ot*j);return(_t>0?Xt<0:Xt>0)?null:this.at(Xt/_t,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class si extends xs{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=Ic,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const al=new pe,Cn=new $c,pa=new vs,rl=new C,ma=new C,ga=new C,va=new C,Nr=new C,xa=new C,ol=new C,ya=new C;class J extends Le{constructor(t=new Se,e=new si){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=n.length;s<r;s++){const o=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const i=this.geometry,n=i.attributes.position,s=i.morphAttributes.position,r=i.morphTargetsRelative;e.fromBufferAttribute(n,t);const o=this.morphTargetInfluences;if(s&&o){xa.set(0,0,0);for(let h=0,l=s.length;h<l;h++){const c=o[h],u=s[h];c!==0&&(Nr.fromBufferAttribute(u,t),r?xa.addScaledVector(Nr,c):xa.addScaledVector(Nr.sub(e),c))}e.add(xa)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const i=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),pa.copy(i.boundingSphere),pa.applyMatrix4(s),Cn.copy(t.ray).recast(t.near),!(pa.containsPoint(Cn.origin)===!1&&(Cn.intersectSphere(pa,rl)===null||Cn.origin.distanceToSquared(rl)>(t.far-t.near)**2))&&(al.copy(s).invert(),Cn.copy(t.ray).applyMatrix4(al),!(i.boundingBox!==null&&Cn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Cn)))}_computeIntersections(t,e,i){let n;const s=this.geometry,r=this.material,o=s.index,h=s.attributes.position,l=s.attributes.uv,c=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(r))for(let m=0,v=d.length;m<v;m++){const p=d[m],g=r[p.materialIndex],y=Math.max(p.start,f.start),b=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let x=y,S=b;x<S;x+=3){const T=o.getX(x),R=o.getX(x+1),M=o.getX(x+2);n=_a(this,g,t,i,l,c,u,T,R,M),n&&(n.faceIndex=Math.floor(x/3),n.face.materialIndex=p.materialIndex,e.push(n))}}else{const m=Math.max(0,f.start),v=Math.min(o.count,f.start+f.count);for(let p=m,g=v;p<g;p+=3){const y=o.getX(p),b=o.getX(p+1),x=o.getX(p+2);n=_a(this,r,t,i,l,c,u,y,b,x),n&&(n.faceIndex=Math.floor(p/3),e.push(n))}}else if(h!==void 0)if(Array.isArray(r))for(let m=0,v=d.length;m<v;m++){const p=d[m],g=r[p.materialIndex],y=Math.max(p.start,f.start),b=Math.min(h.count,Math.min(p.start+p.count,f.start+f.count));for(let x=y,S=b;x<S;x+=3){const T=x,R=x+1,M=x+2;n=_a(this,g,t,i,l,c,u,T,R,M),n&&(n.faceIndex=Math.floor(x/3),n.face.materialIndex=p.materialIndex,e.push(n))}}else{const m=Math.max(0,f.start),v=Math.min(h.count,f.start+f.count);for(let p=m,g=v;p<g;p+=3){const y=p,b=p+1,x=p+2;n=_a(this,r,t,i,l,c,u,y,b,x),n&&(n.faceIndex=Math.floor(p/3),e.push(n))}}}}function ju(a,t,e,i,n,s,r,o){let h;if(t.side===ei?h=i.intersectTriangle(r,s,n,!0,o):h=i.intersectTriangle(n,s,r,t.side===Sn,o),h===null)return null;ya.copy(o),ya.applyMatrix4(a.matrixWorld);const l=e.ray.origin.distanceTo(ya);return l<e.near||l>e.far?null:{distance:l,point:ya.clone(),object:a}}function _a(a,t,e,i,n,s,r,o,h,l){a.getVertexPosition(o,ma),a.getVertexPosition(h,ga),a.getVertexPosition(l,va);const c=ju(a,t,e,i,ma,ga,va,ol);if(c){const u=new C;Li.getBarycoord(ol,ma,ga,va,u),n&&(c.uv=Li.getInterpolatedAttribute(n,o,h,l,u,new ht)),s&&(c.uv1=Li.getInterpolatedAttribute(s,o,h,l,u,new ht)),r&&(c.normal=Li.getInterpolatedAttribute(r,o,h,l,u,new C),c.normal.dot(i.direction)>0&&c.normal.multiplyScalar(-1));const d={a:o,b:h,c:l,normal:new C,materialIndex:0};Li.getNormal(ma,ga,va,d.normal),c.face=d,c.barycoord=u}return c}class Zc extends ii{constructor(t=null,e=1,i=1,n,s,r,o,h,l=Xe,c=Xe,u,d){super(null,r,o,h,l,c,n,s,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class hl extends qe{constructor(t,e,i,n=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const is=new pe,ll=new pe,Ma=[],cl=new Vn,tf=new pe,Rs=new J,Cs=new vs;class ef extends J{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new hl(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,tf)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Vn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,is),cl.copy(t.boundingBox).applyMatrix4(is),this.boundingBox.union(cl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new vs),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,is),Cs.copy(t.boundingSphere).applyMatrix4(is),this.boundingSphere.union(Cs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const i=e.morphTargetInfluences,n=this.morphTexture.source.data.data,s=i.length+1,r=t*s+1;for(let o=0;o<i.length;o++)i[o]=n[r+o]}raycast(t,e){const i=this.matrixWorld,n=this.count;if(Rs.geometry=this.geometry,Rs.material=this.material,Rs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Cs.copy(this.boundingSphere),Cs.applyMatrix4(i),t.ray.intersectsSphere(Cs)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,is),ll.multiplyMatrices(i,is),Rs.matrixWorld=ll,Rs.raycast(t,Ma);for(let r=0,o=Ma.length;r<o;r++){const h=Ma[r];h.instanceId=s,h.object=this,e.push(h)}Ma.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new hl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const i=e.morphTargetInfluences,n=i.length+1;this.morphTexture===null&&(this.morphTexture=new Zc(new Float32Array(n*this.count),n,this.count,dh,Di));const s=this.morphTexture.source.data.data;let r=0;for(let l=0;l<i.length;l++)r+=i[l];const o=this.geometry.morphTargetsRelative?1:1-r,h=n*t;return s[h]=o,s.set(i,h+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Pn=new vs,nf=new ht(.5,.5),wa=new C;class yh{constructor(t=new _n,e=new _n,i=new _n,n=new _n,s=new _n,r=new _n){this.planes=[t,e,i,n,s,r]}set(t,e,i,n,s,r){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(n),o[4].copy(s),o[5].copy(r),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Wi,i=!1){const n=this.planes,s=t.elements,r=s[0],o=s[1],h=s[2],l=s[3],c=s[4],u=s[5],d=s[6],f=s[7],m=s[8],v=s[9],p=s[10],g=s[11],y=s[12],b=s[13],x=s[14],S=s[15];if(n[0].setComponents(l-r,f-c,g-m,S-y).normalize(),n[1].setComponents(l+r,f+c,g+m,S+y).normalize(),n[2].setComponents(l+o,f+u,g+v,S+b).normalize(),n[3].setComponents(l-o,f-u,g-v,S-b).normalize(),i)n[4].setComponents(h,d,p,x).normalize(),n[5].setComponents(l-h,f-d,g-p,S-x).normalize();else if(n[4].setComponents(l-h,f-d,g-p,S-x).normalize(),e===Wi)n[5].setComponents(l+h,f+d,g+p,S+x).normalize();else if(e===Ys)n[5].setComponents(h,d,p,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Pn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Pn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Pn)}intersectsSprite(t){Pn.center.set(0,0,0);const e=nf.distanceTo(t.center);return Pn.radius=.7071067811865476+e,Pn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Pn)}intersectsSphere(t){const e=this.planes,i=t.center,n=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(i)<n)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const n=e[i];if(wa.x=n.normal.x>0?t.max.x:t.min.x,wa.y=n.normal.y>0?t.max.y:t.min.y,wa.z=n.normal.z>0?t.max.z:t.min.z,n.distanceToPoint(wa)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class sf extends xs{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Nt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const dl=new pe,$o=new $c,ba=new vs,Sa=new C;class af extends Le{constructor(t=new Se,e=new sf){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const i=this.geometry,n=this.matrixWorld,s=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ba.copy(i.boundingSphere),ba.applyMatrix4(n),ba.radius+=s,t.ray.intersectsSphere(ba)===!1)return;dl.copy(n).invert(),$o.copy(t.ray).applyMatrix4(dl);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),h=o*o,l=i.index,u=i.attributes.position;if(l!==null){const d=Math.max(0,r.start),f=Math.min(l.count,r.start+r.count);for(let m=d,v=f;m<v;m++){const p=l.getX(m);Sa.fromBufferAttribute(u,p),ul(Sa,p,h,n,t,e,this)}}else{const d=Math.max(0,r.start),f=Math.min(u.count,r.start+r.count);for(let m=d,v=f;m<v;m++)Sa.fromBufferAttribute(u,m),ul(Sa,m,h,n,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=n.length;s<r;s++){const o=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function ul(a,t,e,i,n,s,r){const o=$o.distanceSqToPoint(a);if(o<e){const h=new C;$o.closestPointToPoint(a,h),h.applyMatrix4(i);const l=n.ray.origin.distanceTo(h);if(l<n.near||l>n.far)return;s.push({distance:l,distanceToRay:Math.sqrt(o),point:h,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}class Kc extends ii{constructor(t=[],e=Fn,i,n,s,r,o,h,l,c){super(t,e,i,n,s,r,o,h,l,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class $s extends ii{constructor(t,e,i=Zi,n,s,r,o=Xe,h=Xe,l,c=hn,u=1){if(c!==hn&&c!==Nn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:u};super(d,n,s,r,o,h,c,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new vh(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class rf extends $s{constructor(t,e=Zi,i=Fn,n,s,r=Xe,o=Xe,h,l=hn){const c={width:t,height:t,depth:1},u=[c,c,c,c,c,c];super(t,t,e,i,n,s,r,o,h,l),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Jc extends ii{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class ke extends Se{constructor(t=1,e=1,i=1,n=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:n,heightSegments:s,depthSegments:r};const o=this;n=Math.floor(n),s=Math.floor(s),r=Math.floor(r);const h=[],l=[],c=[],u=[];let d=0,f=0;m("z","y","x",-1,-1,i,e,t,r,s,0),m("z","y","x",1,-1,i,e,-t,r,s,1),m("x","z","y",1,1,t,i,e,n,r,2),m("x","z","y",1,-1,t,i,-e,n,r,3),m("x","y","z",1,-1,t,e,i,n,s,4),m("x","y","z",-1,-1,t,e,-i,n,s,5),this.setIndex(h),this.setAttribute("position",new Jt(l,3)),this.setAttribute("normal",new Jt(c,3)),this.setAttribute("uv",new Jt(u,2));function m(v,p,g,y,b,x,S,T,R,M,E){const L=x/R,N=S/M,k=x/2,D=S/2,I=T/2,P=R+1,B=M+1;let O=0,j=0;const q=new C;for(let tt=0;tt<B;tt++){const it=tt*N-D;for(let It=0;It<P;It++){const Tt=It*L-k;q[v]=Tt*y,q[p]=it*b,q[g]=I,l.push(q.x,q.y,q.z),q[v]=0,q[p]=0,q[g]=T>0?1:-1,c.push(q.x,q.y,q.z),u.push(It/R),u.push(1-tt/M),O+=1}}for(let tt=0;tt<M;tt++)for(let it=0;it<R;it++){const It=d+it+P*tt,Tt=d+it+P*(tt+1),ce=d+(it+1)+P*(tt+1),Qt=d+(it+1)+P*tt;h.push(It,Tt,Qt),h.push(Tt,ce,Qt),j+=6}o.addGroup(f,j,E),f+=j,d+=O}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ke(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class ys extends Se{constructor(t=1,e=32,i=0,n=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:n},e=Math.max(3,e);const s=[],r=[],o=[],h=[],l=new C,c=new ht;r.push(0,0,0),o.push(0,0,1),h.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){const f=i+u/e*n;l.x=t*Math.cos(f),l.y=t*Math.sin(f),r.push(l.x,l.y,l.z),o.push(0,0,1),c.x=(r[d]/t+1)/2,c.y=(r[d+1]/t+1)/2,h.push(c.x,c.y)}for(let u=1;u<=e;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new Jt(r,3)),this.setAttribute("normal",new Jt(o,3)),this.setAttribute("uv",new Jt(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ys(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class ne extends Se{constructor(t=1,e=1,i=1,n=32,s=1,r=!1,o=0,h=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:h};const l=this;n=Math.floor(n),s=Math.floor(s);const c=[],u=[],d=[],f=[];let m=0;const v=[],p=i/2;let g=0;y(),r===!1&&(t>0&&b(!0),e>0&&b(!1)),this.setIndex(c),this.setAttribute("position",new Jt(u,3)),this.setAttribute("normal",new Jt(d,3)),this.setAttribute("uv",new Jt(f,2));function y(){const x=new C,S=new C;let T=0;const R=(e-t)/i;for(let M=0;M<=s;M++){const E=[],L=M/s,N=L*(e-t)+t;for(let k=0;k<=n;k++){const D=k/n,I=D*h+o,P=Math.sin(I),B=Math.cos(I);S.x=N*P,S.y=-L*i+p,S.z=N*B,u.push(S.x,S.y,S.z),x.set(P,R,B).normalize(),d.push(x.x,x.y,x.z),f.push(D,1-L),E.push(m++)}v.push(E)}for(let M=0;M<n;M++)for(let E=0;E<s;E++){const L=v[E][M],N=v[E+1][M],k=v[E+1][M+1],D=v[E][M+1];(t>0||E!==0)&&(c.push(L,N,D),T+=3),(e>0||E!==s-1)&&(c.push(N,k,D),T+=3)}l.addGroup(g,T,0),g+=T}function b(x){const S=m,T=new ht,R=new C;let M=0;const E=x===!0?t:e,L=x===!0?1:-1;for(let k=1;k<=n;k++)u.push(0,p*L,0),d.push(0,L,0),f.push(.5,.5),m++;const N=m;for(let k=0;k<=n;k++){const I=k/n*h+o,P=Math.cos(I),B=Math.sin(I);R.x=E*B,R.y=p*L,R.z=E*P,u.push(R.x,R.y,R.z),d.push(0,L,0),T.x=P*.5+.5,T.y=B*.5*L+.5,f.push(T.x,T.y),m++}for(let k=0;k<n;k++){const D=S+k,I=N+k;x===!0?c.push(I,I+1,D):c.push(I+1,I,D),M+=3}l.addGroup(g,M,x===!0?1:2),g+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ne(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class cn extends ne{constructor(t=1,e=1,i=32,n=1,s=!1,r=0,o=Math.PI*2){super(0,t,e,i,n,s,r,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:n,openEnded:s,thetaStart:r,thetaLength:o}}static fromJSON(t){return new cn(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class ta extends Se{constructor(t=[],e=[],i=1,n=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:n};const s=[],r=[];o(n),l(i),c(),this.setAttribute("position",new Jt(s,3)),this.setAttribute("normal",new Jt(s.slice(),3)),this.setAttribute("uv",new Jt(r,2)),n===0?this.computeVertexNormals():this.normalizeNormals();function o(y){const b=new C,x=new C,S=new C;for(let T=0;T<e.length;T+=3)f(e[T+0],b),f(e[T+1],x),f(e[T+2],S),h(b,x,S,y)}function h(y,b,x,S){const T=S+1,R=[];for(let M=0;M<=T;M++){R[M]=[];const E=y.clone().lerp(x,M/T),L=b.clone().lerp(x,M/T),N=T-M;for(let k=0;k<=N;k++)k===0&&M===T?R[M][k]=E:R[M][k]=E.clone().lerp(L,k/N)}for(let M=0;M<T;M++)for(let E=0;E<2*(T-M)-1;E++){const L=Math.floor(E/2);E%2===0?(d(R[M][L+1]),d(R[M+1][L]),d(R[M][L])):(d(R[M][L+1]),d(R[M+1][L+1]),d(R[M+1][L]))}}function l(y){const b=new C;for(let x=0;x<s.length;x+=3)b.x=s[x+0],b.y=s[x+1],b.z=s[x+2],b.normalize().multiplyScalar(y),s[x+0]=b.x,s[x+1]=b.y,s[x+2]=b.z}function c(){const y=new C;for(let b=0;b<s.length;b+=3){y.x=s[b+0],y.y=s[b+1],y.z=s[b+2];const x=p(y)/2/Math.PI+.5,S=g(y)/Math.PI+.5;r.push(x,1-S)}m(),u()}function u(){for(let y=0;y<r.length;y+=6){const b=r[y+0],x=r[y+2],S=r[y+4],T=Math.max(b,x,S),R=Math.min(b,x,S);T>.9&&R<.1&&(b<.2&&(r[y+0]+=1),x<.2&&(r[y+2]+=1),S<.2&&(r[y+4]+=1))}}function d(y){s.push(y.x,y.y,y.z)}function f(y,b){const x=y*3;b.x=t[x+0],b.y=t[x+1],b.z=t[x+2]}function m(){const y=new C,b=new C,x=new C,S=new C,T=new ht,R=new ht,M=new ht;for(let E=0,L=0;E<s.length;E+=9,L+=6){y.set(s[E+0],s[E+1],s[E+2]),b.set(s[E+3],s[E+4],s[E+5]),x.set(s[E+6],s[E+7],s[E+8]),T.set(r[L+0],r[L+1]),R.set(r[L+2],r[L+3]),M.set(r[L+4],r[L+5]),S.copy(y).add(b).add(x).divideScalar(3);const N=p(S);v(T,L+0,y,N),v(R,L+2,b,N),v(M,L+4,x,N)}}function v(y,b,x,S){S<0&&y.x===1&&(r[b]=y.x-1),x.x===0&&x.z===0&&(r[b]=S/2/Math.PI+.5)}function p(y){return Math.atan2(y.z,-y.x)}function g(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ta(t.vertices,t.indices,t.radius,t.detail)}}class oi extends ta{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,n=1/i,s=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-n,-i,0,-n,i,0,n,-i,0,n,i,-n,-i,0,-n,i,0,n,-i,0,n,i,0,-i,0,-n,i,0,-n,-i,0,n,i,0,n],r=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(s,r,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new oi(t.radius,t.detail)}}class Ji{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Bt("Curve: .getPoint() not implemented.")}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,n=this.getPoint(0),s=0;e.push(0);for(let r=1;r<=t;r++)i=this.getPoint(r/t),s+=i.distanceTo(n),e.push(s),n=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const i=this.getLengths();let n=0;const s=i.length;let r;e?r=e:r=t*i[s-1];let o=0,h=s-1,l;for(;o<=h;)if(n=Math.floor(o+(h-o)/2),l=i[n]-r,l<0)o=n+1;else if(l>0)h=n-1;else{h=n;break}if(n=h,i[n]===r)return n/(s-1);const c=i[n],d=i[n+1]-c,f=(r-c)/d;return(n+f)/(s-1)}getTangent(t,e){let n=t-1e-4,s=t+1e-4;n<0&&(n=0),s>1&&(s=1);const r=this.getPoint(n),o=this.getPoint(s),h=e||(r.isVector2?new ht:new C);return h.copy(o).sub(r).normalize(),h}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e=!1){const i=new C,n=[],s=[],r=[],o=new C,h=new pe;for(let f=0;f<=t;f++){const m=f/t;n[f]=this.getTangentAt(m,new C)}s[0]=new C,r[0]=new C;let l=Number.MAX_VALUE;const c=Math.abs(n[0].x),u=Math.abs(n[0].y),d=Math.abs(n[0].z);c<=l&&(l=c,i.set(1,0,0)),u<=l&&(l=u,i.set(0,1,0)),d<=l&&i.set(0,0,1),o.crossVectors(n[0],i).normalize(),s[0].crossVectors(n[0],o),r[0].crossVectors(n[0],s[0]);for(let f=1;f<=t;f++){if(s[f]=s[f-1].clone(),r[f]=r[f-1].clone(),o.crossVectors(n[f-1],n[f]),o.length()>Number.EPSILON){o.normalize();const m=Math.acos($t(n[f-1].dot(n[f]),-1,1));s[f].applyMatrix4(h.makeRotationAxis(o,m))}r[f].crossVectors(n[f],s[f])}if(e===!0){let f=Math.acos($t(s[0].dot(s[t]),-1,1));f/=t,n[0].dot(o.crossVectors(s[0],s[t]))>0&&(f=-f);for(let m=1;m<=t;m++)s[m].applyMatrix4(h.makeRotationAxis(n[m],f*m)),r[m].crossVectors(n[m],s[m])}return{tangents:n,normals:s,binormals:r}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class _h extends Ji{constructor(t=0,e=0,i=1,n=1,s=0,r=Math.PI*2,o=!1,h=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=n,this.aStartAngle=s,this.aEndAngle=r,this.aClockwise=o,this.aRotation=h}getPoint(t,e=new ht){const i=e,n=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const r=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=n;for(;s>n;)s-=n;s<Number.EPSILON&&(r?s=0:s=n),this.aClockwise===!0&&!r&&(s===n?s=-n:s=s-n);const o=this.aStartAngle+t*s;let h=this.aX+this.xRadius*Math.cos(o),l=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const c=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=h-this.aX,f=l-this.aY;h=d*c-f*u+this.aX,l=d*u+f*c+this.aY}return i.set(h,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class of extends _h{constructor(t,e,i,n,s,r){super(t,e,i,i,n,s,r),this.isArcCurve=!0,this.type="ArcCurve"}}function Mh(){let a=0,t=0,e=0,i=0;function n(s,r,o,h){a=s,t=o,e=-3*s+3*r-2*o-h,i=2*s-2*r+o+h}return{initCatmullRom:function(s,r,o,h,l){n(r,o,l*(o-s),l*(h-r))},initNonuniformCatmullRom:function(s,r,o,h,l,c,u){let d=(r-s)/l-(o-s)/(l+c)+(o-r)/c,f=(o-r)/c-(h-r)/(c+u)+(h-o)/u;d*=c,f*=c,n(r,o,d,f)},calc:function(s){const r=s*s,o=r*s;return a+t*s+e*r+i*o}}}const fl=new C,pl=new C,Ur=new Mh,Fr=new Mh,zr=new Mh;class Qc extends Ji{constructor(t=[],e=!1,i="centripetal",n=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=n}getPoint(t,e=new C){const i=e,n=this.points,s=n.length,r=(s-(this.closed?0:1))*t;let o=Math.floor(r),h=r-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:h===0&&o===s-1&&(o=s-2,h=1);let l,c;this.closed||o>0?l=n[(o-1)%s]:(pl.subVectors(n[0],n[1]).add(n[0]),l=pl);const u=n[o%s],d=n[(o+1)%s];if(this.closed||o+2<s?c=n[(o+2)%s]:(fl.subVectors(n[s-1],n[s-2]).add(n[s-1]),c=fl),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let m=Math.pow(l.distanceToSquared(u),f),v=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(c),f);v<1e-4&&(v=1),m<1e-4&&(m=v),p<1e-4&&(p=v),Ur.initNonuniformCatmullRom(l.x,u.x,d.x,c.x,m,v,p),Fr.initNonuniformCatmullRom(l.y,u.y,d.y,c.y,m,v,p),zr.initNonuniformCatmullRom(l.z,u.z,d.z,c.z,m,v,p)}else this.curveType==="catmullrom"&&(Ur.initCatmullRom(l.x,u.x,d.x,c.x,this.tension),Fr.initCatmullRom(l.y,u.y,d.y,c.y,this.tension),zr.initCatmullRom(l.z,u.z,d.z,c.z,this.tension));return i.set(Ur.calc(h),Fr.calc(h),zr.calc(h)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const n=t.points[e];this.points.push(n.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const n=this.points[e];t.points.push(n.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const n=t.points[e];this.points.push(new C().fromArray(n))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ml(a,t,e,i,n){const s=(i-t)*.5,r=(n-e)*.5,o=a*a,h=a*o;return(2*e-2*i+s+r)*h+(-3*e+3*i-2*s-r)*o+s*a+e}function hf(a,t){const e=1-a;return e*e*t}function lf(a,t){return 2*(1-a)*a*t}function cf(a,t){return a*a*t}function Os(a,t,e,i){return hf(a,t)+lf(a,e)+cf(a,i)}function df(a,t){const e=1-a;return e*e*e*t}function uf(a,t){const e=1-a;return 3*e*e*a*t}function ff(a,t){return 3*(1-a)*a*a*t}function pf(a,t){return a*a*a*t}function Hs(a,t,e,i,n){return df(a,t)+uf(a,e)+ff(a,i)+pf(a,n)}class jc extends Ji{constructor(t=new ht,e=new ht,i=new ht,n=new ht){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=n}getPoint(t,e=new ht){const i=e,n=this.v0,s=this.v1,r=this.v2,o=this.v3;return i.set(Hs(t,n.x,s.x,r.x,o.x),Hs(t,n.y,s.y,r.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class mf extends Ji{constructor(t=new C,e=new C,i=new C,n=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=n}getPoint(t,e=new C){const i=e,n=this.v0,s=this.v1,r=this.v2,o=this.v3;return i.set(Hs(t,n.x,s.x,r.x,o.x),Hs(t,n.y,s.y,r.y,o.y),Hs(t,n.z,s.z,r.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class td extends Ji{constructor(t=new ht,e=new ht){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ht){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ht){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class gf extends Ji{constructor(t=new C,e=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new C){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new C){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ed extends Ji{constructor(t=new ht,e=new ht,i=new ht){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new ht){const i=e,n=this.v0,s=this.v1,r=this.v2;return i.set(Os(t,n.x,s.x,r.x),Os(t,n.y,s.y,r.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class vf extends Ji{constructor(t=new C,e=new C,i=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new C){const i=e,n=this.v0,s=this.v1,r=this.v2;return i.set(Os(t,n.x,s.x,r.x),Os(t,n.y,s.y,r.y),Os(t,n.z,s.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class id extends Ji{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ht){const i=e,n=this.points,s=(n.length-1)*t,r=Math.floor(s),o=s-r,h=n[r===0?r:r-1],l=n[r],c=n[r>n.length-2?n.length-1:r+1],u=n[r>n.length-3?n.length-1:r+2];return i.set(ml(o,h.x,l.x,c.x,u.x),ml(o,h.y,l.y,c.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const n=t.points[e];this.points.push(n.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const n=this.points[e];t.points.push(n.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const n=t.points[e];this.points.push(new ht().fromArray(n))}return this}}var gl=Object.freeze({__proto__:null,ArcCurve:of,CatmullRomCurve3:Qc,CubicBezierCurve:jc,CubicBezierCurve3:mf,EllipseCurve:_h,LineCurve:td,LineCurve3:gf,QuadraticBezierCurve:ed,QuadraticBezierCurve3:vf,SplineCurve:id});class xf extends Ji{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new gl[i](e,t))}return this}getPoint(t,e){const i=t*this.getLength(),n=this.getCurveLengths();let s=0;for(;s<n.length;){if(n[s]>=i){const r=n[s]-i,o=this.curves[s],h=o.getLength(),l=h===0?0:1-r/h;return o.getPointAt(l,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let i=0,n=this.curves.length;i<n;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let i;for(let n=0,s=this.curves;n<s.length;n++){const r=s[n],o=r.isEllipseCurve?t*2:r.isLineCurve||r.isLineCurve3?1:r.isSplineCurve?t*r.points.length:t,h=r.getPoints(o);for(let l=0;l<h.length;l++){const c=h[l];i&&i.equals(c)||(e.push(c),i=c)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const n=t.curves[e];this.curves.push(n.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){const n=this.curves[e];t.curves.push(n.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const n=t.curves[e];this.curves.push(new gl[n.type]().fromJSON(n))}return this}}class vl extends xf{constructor(t){super(),this.type="Path",this.currentPoint=new ht,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const i=new td(this.currentPoint.clone(),new ht(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,n){const s=new ed(this.currentPoint.clone(),new ht(t,e),new ht(i,n));return this.curves.push(s),this.currentPoint.set(i,n),this}bezierCurveTo(t,e,i,n,s,r){const o=new jc(this.currentPoint.clone(),new ht(t,e),new ht(i,n),new ht(s,r));return this.curves.push(o),this.currentPoint.set(s,r),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),i=new id(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,n,s,r){const o=this.currentPoint.x,h=this.currentPoint.y;return this.absarc(t+o,e+h,i,n,s,r),this}absarc(t,e,i,n,s,r){return this.absellipse(t,e,i,i,n,s,r),this}ellipse(t,e,i,n,s,r,o,h){const l=this.currentPoint.x,c=this.currentPoint.y;return this.absellipse(t+l,e+c,i,n,s,r,o,h),this}absellipse(t,e,i,n,s,r,o,h){const l=new _h(t,e,i,n,s,r,o,h);if(this.curves.length>0){const u=l.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(l);const c=l.getPoint(1);return this.currentPoint.copy(c),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class wh extends vl{constructor(t){super(t),this.uuid=gs(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let i=0,n=this.holes.length;i<n;i++)e[i]=this.holes[i].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){const n=t.holes[e];this.holes.push(n.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,i=this.holes.length;e<i;e++){const n=this.holes[e];t.holes.push(n.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){const n=t.holes[e];this.holes.push(new vl().fromJSON(n))}return this}}function yf(a,t,e=2){const i=t&&t.length,n=i?t[0]*e:a.length;let s=nd(a,0,n,e,!0);const r=[];if(!s||s.next===s.prev)return r;let o,h,l;if(i&&(s=Sf(a,t,s,e)),a.length>80*e){o=a[0],h=a[1];let c=o,u=h;for(let d=e;d<n;d+=e){const f=a[d],m=a[d+1];f<o&&(o=f),m<h&&(h=m),f>c&&(c=f),m>u&&(u=m)}l=Math.max(c-o,u-h),l=l!==0?32767/l:0}return Zs(s,r,e,o,h,l,0),r}function nd(a,t,e,i,n){let s;if(n===Nf(a,t,e,i)>0)for(let r=t;r<e;r+=i)s=xl(r/i|0,a[r],a[r+1],s);else for(let r=e-i;r>=t;r-=i)s=xl(r/i|0,a[r],a[r+1],s);return s&&us(s,s.next)&&(Js(s),s=s.next),s}function Bn(a,t){if(!a)return a;t||(t=a);let e=a,i;do if(i=!1,!e.steiner&&(us(e,e.next)||Ce(e.prev,e,e.next)===0)){if(Js(e),e=t=e.prev,e===e.next)break;i=!0}else e=e.next;while(i||e!==t);return t}function Zs(a,t,e,i,n,s,r){if(!a)return;!r&&s&&Cf(a,i,n,s);let o=a;for(;a.prev!==a.next;){const h=a.prev,l=a.next;if(s?Mf(a,i,n,s):_f(a)){t.push(h.i,a.i,l.i),Js(a),a=l.next,o=l.next;continue}if(a=l,a===o){r?r===1?(a=wf(Bn(a),t),Zs(a,t,e,i,n,s,2)):r===2&&bf(a,t,e,i,n,s):Zs(Bn(a),t,e,i,n,s,1);break}}}function _f(a){const t=a.prev,e=a,i=a.next;if(Ce(t,e,i)>=0)return!1;const n=t.x,s=e.x,r=i.x,o=t.y,h=e.y,l=i.y,c=Math.min(n,s,r),u=Math.min(o,h,l),d=Math.max(n,s,r),f=Math.max(o,h,l);let m=i.next;for(;m!==t;){if(m.x>=c&&m.x<=d&&m.y>=u&&m.y<=f&&Us(n,o,s,h,r,l,m.x,m.y)&&Ce(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Mf(a,t,e,i){const n=a.prev,s=a,r=a.next;if(Ce(n,s,r)>=0)return!1;const o=n.x,h=s.x,l=r.x,c=n.y,u=s.y,d=r.y,f=Math.min(o,h,l),m=Math.min(c,u,d),v=Math.max(o,h,l),p=Math.max(c,u,d),g=Zo(f,m,t,e,i),y=Zo(v,p,t,e,i);let b=a.prevZ,x=a.nextZ;for(;b&&b.z>=g&&x&&x.z<=y;){if(b.x>=f&&b.x<=v&&b.y>=m&&b.y<=p&&b!==n&&b!==r&&Us(o,c,h,u,l,d,b.x,b.y)&&Ce(b.prev,b,b.next)>=0||(b=b.prevZ,x.x>=f&&x.x<=v&&x.y>=m&&x.y<=p&&x!==n&&x!==r&&Us(o,c,h,u,l,d,x.x,x.y)&&Ce(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;b&&b.z>=g;){if(b.x>=f&&b.x<=v&&b.y>=m&&b.y<=p&&b!==n&&b!==r&&Us(o,c,h,u,l,d,b.x,b.y)&&Ce(b.prev,b,b.next)>=0)return!1;b=b.prevZ}for(;x&&x.z<=y;){if(x.x>=f&&x.x<=v&&x.y>=m&&x.y<=p&&x!==n&&x!==r&&Us(o,c,h,u,l,d,x.x,x.y)&&Ce(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function wf(a,t){let e=a;do{const i=e.prev,n=e.next.next;!us(i,n)&&ad(i,e,e.next,n)&&Ks(i,n)&&Ks(n,i)&&(t.push(i.i,e.i,n.i),Js(e),Js(e.next),e=a=n),e=e.next}while(e!==a);return Bn(e)}function bf(a,t,e,i,n,s){let r=a;do{let o=r.next.next;for(;o!==r.prev;){if(r.i!==o.i&&Lf(r,o)){let h=rd(r,o);r=Bn(r,r.next),h=Bn(h,h.next),Zs(r,t,e,i,n,s,0),Zs(h,t,e,i,n,s,0);return}o=o.next}r=r.next}while(r!==a)}function Sf(a,t,e,i){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s]*i,h=s<r-1?t[s+1]*i:a.length,l=nd(a,o,h,i,!1);l===l.next&&(l.steiner=!0),n.push(kf(l))}n.sort(Tf);for(let s=0;s<n.length;s++)e=Ef(n[s],e);return e}function Tf(a,t){let e=a.x-t.x;if(e===0&&(e=a.y-t.y,e===0)){const i=(a.next.y-a.y)/(a.next.x-a.x),n=(t.next.y-t.y)/(t.next.x-t.x);e=i-n}return e}function Ef(a,t){const e=Af(a,t);if(!e)return t;const i=rd(e,a);return Bn(i,i.next),Bn(e,e.next)}function Af(a,t){let e=t;const i=a.x,n=a.y;let s=-1/0,r;if(us(a,e))return e;do{if(us(a,e.next))return e.next;if(n<=e.y&&n>=e.next.y&&e.next.y!==e.y){const u=e.x+(n-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=i&&u>s&&(s=u,r=e.x<e.next.x?e:e.next,u===i))return r}e=e.next}while(e!==t);if(!r)return null;const o=r,h=r.x,l=r.y;let c=1/0;e=r;do{if(i>=e.x&&e.x>=h&&i!==e.x&&sd(n<l?i:s,n,h,l,n<l?s:i,n,e.x,e.y)){const u=Math.abs(n-e.y)/(i-e.x);Ks(e,a)&&(u<c||u===c&&(e.x>r.x||e.x===r.x&&Rf(r,e)))&&(r=e,c=u)}e=e.next}while(e!==o);return r}function Rf(a,t){return Ce(a.prev,a,t.prev)<0&&Ce(t.next,a,a.next)<0}function Cf(a,t,e,i){let n=a;do n.z===0&&(n.z=Zo(n.x,n.y,t,e,i)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==a);n.prevZ.nextZ=null,n.prevZ=null,Pf(n)}function Pf(a){let t,e=1;do{let i=a,n;a=null;let s=null;for(t=0;i;){t++;let r=i,o=0;for(let l=0;l<e&&(o++,r=r.nextZ,!!r);l++);let h=e;for(;o>0||h>0&&r;)o!==0&&(h===0||!r||i.z<=r.z)?(n=i,i=i.nextZ,o--):(n=r,r=r.nextZ,h--),s?s.nextZ=n:a=n,n.prevZ=s,s=n;i=r}s.nextZ=null,e*=2}while(t>1);return a}function Zo(a,t,e,i,n){return a=(a-e)*n|0,t=(t-i)*n|0,a=(a|a<<8)&16711935,a=(a|a<<4)&252645135,a=(a|a<<2)&858993459,a=(a|a<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,a|t<<1}function kf(a){let t=a,e=a;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==a);return e}function sd(a,t,e,i,n,s,r,o){return(n-r)*(t-o)>=(a-r)*(s-o)&&(a-r)*(i-o)>=(e-r)*(t-o)&&(e-r)*(s-o)>=(n-r)*(i-o)}function Us(a,t,e,i,n,s,r,o){return!(a===r&&t===o)&&sd(a,t,e,i,n,s,r,o)}function Lf(a,t){return a.next.i!==t.i&&a.prev.i!==t.i&&!Df(a,t)&&(Ks(a,t)&&Ks(t,a)&&If(a,t)&&(Ce(a.prev,a,t.prev)||Ce(a,t.prev,t))||us(a,t)&&Ce(a.prev,a,a.next)>0&&Ce(t.prev,t,t.next)>0)}function Ce(a,t,e){return(t.y-a.y)*(e.x-t.x)-(t.x-a.x)*(e.y-t.y)}function us(a,t){return a.x===t.x&&a.y===t.y}function ad(a,t,e,i){const n=Ea(Ce(a,t,e)),s=Ea(Ce(a,t,i)),r=Ea(Ce(e,i,a)),o=Ea(Ce(e,i,t));return!!(n!==s&&r!==o||n===0&&Ta(a,e,t)||s===0&&Ta(a,i,t)||r===0&&Ta(e,a,i)||o===0&&Ta(e,t,i))}function Ta(a,t,e){return t.x<=Math.max(a.x,e.x)&&t.x>=Math.min(a.x,e.x)&&t.y<=Math.max(a.y,e.y)&&t.y>=Math.min(a.y,e.y)}function Ea(a){return a>0?1:a<0?-1:0}function Df(a,t){let e=a;do{if(e.i!==a.i&&e.next.i!==a.i&&e.i!==t.i&&e.next.i!==t.i&&ad(e,e.next,a,t))return!0;e=e.next}while(e!==a);return!1}function Ks(a,t){return Ce(a.prev,a,a.next)<0?Ce(a,t,a.next)>=0&&Ce(a,a.prev,t)>=0:Ce(a,t,a.prev)<0||Ce(a,a.next,t)<0}function If(a,t){let e=a,i=!1;const n=(a.x+t.x)/2,s=(a.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&n<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(i=!i),e=e.next;while(e!==a);return i}function rd(a,t){const e=Ko(a.i,a.x,a.y),i=Ko(t.i,t.x,t.y),n=a.next,s=t.prev;return a.next=t,t.prev=a,e.next=n,n.prev=e,i.next=e,e.prev=i,s.next=i,i.prev=s,i}function xl(a,t,e,i){const n=Ko(a,t,e);return i?(n.next=i.next,n.prev=i,i.next.prev=n,i.next=n):(n.prev=n,n.next=n),n}function Js(a){a.next.prev=a.prev,a.prev.next=a.next,a.prevZ&&(a.prevZ.nextZ=a.nextZ),a.nextZ&&(a.nextZ.prevZ=a.prevZ)}function Ko(a,t,e){return{i:a,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Nf(a,t,e,i){let n=0;for(let s=t,r=e-i;s<e;s+=i)n+=(a[r]-a[s])*(a[s+1]+a[r+1]),r=s;return n}class Uf{static triangulate(t,e,i=2){return yf(t,e,i)}}class Gs{static area(t){const e=t.length;let i=0;for(let n=e-1,s=0;s<e;n=s++)i+=t[n].x*t[s].y-t[s].x*t[n].y;return i*.5}static isClockWise(t){return Gs.area(t)<0}static triangulateShape(t,e){const i=[],n=[],s=[];yl(t),_l(i,t);let r=t.length;e.forEach(yl);for(let h=0;h<e.length;h++)n.push(r),r+=e[h].length,_l(i,e[h]);const o=Uf.triangulate(i,n);for(let h=0;h<o.length;h+=3)s.push(o.slice(h,h+3));return s}}function yl(a){const t=a.length;t>2&&a[t-1].equals(a[0])&&a.pop()}function _l(a,t){for(let e=0;e<t.length;e++)a.push(t[e].x),a.push(t[e].y)}class Qs extends ta{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,n=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(n,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Qs(t.radius,t.detail)}}class Si extends ta{constructor(t=1,e=0){const i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],n=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,n,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Si(t.radius,t.detail)}}class Tn extends Se{constructor(t=1,e=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:n};const s=t/2,r=e/2,o=Math.floor(i),h=Math.floor(n),l=o+1,c=h+1,u=t/o,d=e/h,f=[],m=[],v=[],p=[];for(let g=0;g<c;g++){const y=g*d-r;for(let b=0;b<l;b++){const x=b*u-s;m.push(x,-y,0),v.push(0,0,1),p.push(b/o),p.push(1-g/h)}}for(let g=0;g<h;g++)for(let y=0;y<o;y++){const b=y+l*g,x=y+l*(g+1),S=y+1+l*(g+1),T=y+1+l*g;f.push(b,x,T),f.push(x,S,T)}this.setIndex(f),this.setAttribute("position",new Jt(m,3)),this.setAttribute("normal",new Jt(v,3)),this.setAttribute("uv",new Jt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Tn(t.width,t.height,t.widthSegments,t.heightSegments)}}class Ja extends Se{constructor(t=.5,e=1,i=32,n=1,s=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:n,thetaStart:s,thetaLength:r},i=Math.max(3,i),n=Math.max(1,n);const o=[],h=[],l=[],c=[];let u=t;const d=(e-t)/n,f=new C,m=new ht;for(let v=0;v<=n;v++){for(let p=0;p<=i;p++){const g=s+p/i*r;f.x=u*Math.cos(g),f.y=u*Math.sin(g),h.push(f.x,f.y,f.z),l.push(0,0,1),m.x=(f.x/e+1)/2,m.y=(f.y/e+1)/2,c.push(m.x,m.y)}u+=d}for(let v=0;v<n;v++){const p=v*(i+1);for(let g=0;g<i;g++){const y=g+p,b=y,x=y+i+1,S=y+i+2,T=y+1;o.push(b,x,T),o.push(x,S,T)}}this.setIndex(o),this.setAttribute("position",new Jt(h,3)),this.setAttribute("normal",new Jt(l,3)),this.setAttribute("uv",new Jt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ja(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class nr extends Se{constructor(t=new wh([new ht(0,.5),new ht(-.5,-.5),new ht(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const i=[],n=[],s=[],r=[];let o=0,h=0;if(Array.isArray(t)===!1)l(t);else for(let c=0;c<t.length;c++)l(t[c]),this.addGroup(o,h,c),o+=h,h=0;this.setIndex(i),this.setAttribute("position",new Jt(n,3)),this.setAttribute("normal",new Jt(s,3)),this.setAttribute("uv",new Jt(r,2));function l(c){const u=n.length/3,d=c.extractPoints(e);let f=d.shape;const m=d.holes;Gs.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,g=m.length;p<g;p++){const y=m[p];Gs.isClockWise(y)===!0&&(m[p]=y.reverse())}const v=Gs.triangulateShape(f,m);for(let p=0,g=m.length;p<g;p++){const y=m[p];f=f.concat(y)}for(let p=0,g=f.length;p<g;p++){const y=f[p];n.push(y.x,y.y,0),s.push(0,0,1),r.push(y.x,y.y)}for(let p=0,g=v.length;p<g;p++){const y=v[p],b=y[0]+u,x=y[1]+u,S=y[2]+u;i.push(b,x,S),h+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return Ff(e,t)}static fromJSON(t,e){const i=[];for(let n=0,s=t.shapes.length;n<s;n++){const r=e[t.shapes[n]];i.push(r)}return new nr(i,t.curveSegments)}}function Ff(a,t){if(t.shapes=[],Array.isArray(a))for(let e=0,i=a.length;e<i;e++){const n=a[e];t.shapes.push(n.uuid)}else t.shapes.push(a.uuid);return t}class wi extends Se{constructor(t=1,e=32,i=16,n=0,s=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:n,phiLength:s,thetaStart:r,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const h=Math.min(r+o,Math.PI);let l=0;const c=[],u=new C,d=new C,f=[],m=[],v=[],p=[];for(let g=0;g<=i;g++){const y=[],b=g/i,x=r+b*o,S=t*Math.cos(x),T=Math.sqrt(t*t-S*S);let R=0;g===0&&r===0?R=.5/e:g===i&&h===Math.PI&&(R=-.5/e);for(let M=0;M<=e;M++){const E=M/e,L=n+E*s;u.x=-T*Math.cos(L),u.y=S,u.z=T*Math.sin(L),m.push(u.x,u.y,u.z),d.copy(u).normalize(),v.push(d.x,d.y,d.z),p.push(E+R,1-b),y.push(l++)}c.push(y)}for(let g=0;g<i;g++)for(let y=0;y<e;y++){const b=c[g][y+1],x=c[g][y],S=c[g+1][y],T=c[g+1][y+1];(g!==0||r>0)&&f.push(b,x,T),(g!==i-1||h<Math.PI)&&f.push(x,S,T)}this.setIndex(f),this.setAttribute("position",new Jt(m,3)),this.setAttribute("normal",new Jt(v,3)),this.setAttribute("uv",new Jt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new wi(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class bi extends Se{constructor(t=1,e=.4,i=12,n=48,s=Math.PI*2,r=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:n,arc:s,thetaStart:r,thetaLength:o},i=Math.floor(i),n=Math.floor(n);const h=[],l=[],c=[],u=[],d=new C,f=new C,m=new C;for(let v=0;v<=i;v++){const p=r+v/i*o;for(let g=0;g<=n;g++){const y=g/n*s;f.x=(t+e*Math.cos(p))*Math.cos(y),f.y=(t+e*Math.cos(p))*Math.sin(y),f.z=e*Math.sin(p),l.push(f.x,f.y,f.z),d.x=t*Math.cos(y),d.y=t*Math.sin(y),m.subVectors(f,d).normalize(),c.push(m.x,m.y,m.z),u.push(g/n),u.push(v/i)}}for(let v=1;v<=i;v++)for(let p=1;p<=n;p++){const g=(n+1)*v+p-1,y=(n+1)*(v-1)+p-1,b=(n+1)*(v-1)+p,x=(n+1)*v+p;h.push(g,y,x),h.push(y,b,x)}this.setIndex(h),this.setAttribute("position",new Jt(l,3)),this.setAttribute("normal",new Jt(c,3)),this.setAttribute("uv",new Jt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new bi(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}}function fs(a){const t={};for(const e in a){t[e]={};for(const i in a[e]){const n=a[e][i];if(Ml(n))n.isRenderTargetTexture?(Bt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=n.clone();else if(Array.isArray(n))if(Ml(n[0])){const s=[];for(let r=0,o=n.length;r<o;r++)s[r]=n[r].clone();t[e][i]=s}else t[e][i]=n.slice();else t[e][i]=n}}return t}function ti(a){const t={};for(let e=0;e<a.length;e++){const i=fs(a[e]);for(const n in i)t[n]=i[n]}return t}function Ml(a){return a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)}function zf(a){const t=[];for(let e=0;e<a.length;e++)t.push(a[e].clone());return t}function od(a){const t=a.getRenderTarget();return t===null?a.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}const ps={clone:fs,merge:ti};var Bf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Of=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Be extends xs{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Bf,this.fragmentShader=Of,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=fs(t.uniforms),this.uniformsGroups=zf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const n in this.uniforms){const r=this.uniforms[n].value;r&&r.isTexture?e.uniforms[n]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[n]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[n]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[n]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[n]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[n]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[n]={type:"m4",value:r.toArray()}:e.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const i in t.uniforms){const n=t.uniforms[i];switch(this.uniforms[i]={},n.type){case"t":this.uniforms[i].value=e[n.value]||null;break;case"c":this.uniforms[i].value=new Nt().setHex(n.value);break;case"v2":this.uniforms[i].value=new ht().fromArray(n.value);break;case"v3":this.uniforms[i].value=new C().fromArray(n.value);break;case"v4":this.uniforms[i].value=new Re().fromArray(n.value);break;case"m3":this.uniforms[i].value=new Ht().fromArray(n.value);break;case"m4":this.uniforms[i].value=new pe().fromArray(n.value);break;default:this.uniforms[i].value=n.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class hd extends Be{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Ki extends xs{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Nt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qo,this.normalScale=new ht(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Hf extends xs{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=xu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Gf extends xs{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class bh extends Le{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Nt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class Vf extends bh{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Nt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Br=new pe,wl=new C,bl=new C;class ld{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ht(512,512),this.mapType=vi,this.map=null,this.mapPass=null,this.matrix=new pe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new yh,this._frameExtents=new ht(1,1),this._viewportCount=1,this._viewports=[new Re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;wl.setFromMatrixPosition(t.matrixWorld),e.position.copy(wl),bl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(bl),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,i,n){Br.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(Br,t.coordinateSystem,t.reversedDepth);const s=this._frameExtents,r=n?n.z/s.x:1,o=n?n.w/s.y:1,h=n?n.x/s.x:0,l=n?n.y/s.y:0;t.coordinateSystem===Ys||t.reversedDepth?e.set(.5*r,0,0,.5*r+h,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):e.set(.5*r,0,0,.5*r+h,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),e.multiply(Br)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Aa=new C,Ra=new Gn,Fi=new C;class cd extends Le{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pe,this.projectionMatrix=new pe,this.projectionMatrixInverse=new pe,this.coordinateSystem=Wi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Aa,Ra,Fi),Fi.x===1&&Fi.y===1&&Fi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Aa,Ra,Fi.set(1,1,1)).invert()}updateWorldMatrix(t,e,i=!1){super.updateWorldMatrix(t,e,i),this.matrixWorld.decompose(Aa,Ra,Fi),Fi.x===1&&Fi.y===1&&Fi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Aa,Ra,Fi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const xn=new C,Sl=new ht,Tl=new ht;class gi extends cd{constructor(t=50,e=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Yo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(pr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Yo*2*Math.atan(Math.tan(pr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){xn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(xn.x,xn.y).multiplyScalar(-t/xn.z),xn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(xn.x,xn.y).multiplyScalar(-t/xn.z)}getViewSize(t,e){return this.getViewBounds(t,Sl,Tl),e.subVectors(Tl,Sl)}setViewOffset(t,e,i,n,s,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(pr*.5*this.fov)/this.zoom,i=2*e,n=this.aspect*i,s=-.5*n;const r=this.view;if(this.view!==null&&this.view.enabled){const h=r.fullWidth,l=r.fullHeight;s+=r.offsetX*n/h,e-=r.offsetY*i/l,n*=r.width/h,i*=r.height/l}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+n,e,e-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class Wf extends ld{constructor(){super(new gi(90,1,.5,500)),this.isPointLightShadow=!0}}class Xf extends bh{constructor(t,e,i=0,n=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=n,this.shadow=new Wf}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}}class sr extends cd{constructor(t=-1,e=1,i=1,n=-1,s=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=n,this.near=s,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,n,s,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let s=i-t,r=i+t,o=n+e,h=n-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,r=s+l*this.view.width,o-=c*this.view.offsetY,h=o-c*this.view.height}this.projectionMatrix.makeOrthographic(s,r,o,h,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class qf extends ld{constructor(){super(new sr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Yf extends bh{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.target=new Le,this.shadow=new qf}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}const ns=-90,ss=1;class $f extends Le{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const n=new gi(ns,ss,t,e);n.layers=this.layers,this.add(n);const s=new gi(ns,ss,t,e);s.layers=this.layers,this.add(s);const r=new gi(ns,ss,t,e);r.layers=this.layers,this.add(r);const o=new gi(ns,ss,t,e);o.layers=this.layers,this.add(o);const h=new gi(ns,ss,t,e);h.layers=this.layers,this.add(h);const l=new gi(ns,ss,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,n,s,r,o,h]=e;for(const l of e)this.remove(l);if(t===Wi)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),h.up.set(0,1,0),h.lookAt(0,0,-1);else if(t===Ys)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),h.up.set(0,-1,0),h.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,r,o,h,l,c]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;t.isWebGLRenderer===!0?p=t.state.buffers.depth.getReversed():p=t.reversedDepthBuffer,t.setRenderTarget(i,0,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,s),t.setRenderTarget(i,1,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(i,2,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(i,3,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(i,4,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),i.texture.generateMipmaps=v,t.setRenderTarget(i,5,n),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(u,d,f),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}}class Zf extends gi{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Kf{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=Jf.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}}function Jf(){this._document.hidden===!1&&this.reset()}class dd{static{dd.prototype.isMatrix2=!0}constructor(t,e,i,n){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,i,n)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let i=0;i<4;i++)this.elements[i]=t[i+e];return this}set(t,e,i,n){const s=this.elements;return s[0]=t,s[2]=e,s[1]=i,s[3]=n,this}}function El(a,t,e,i){const n=Qf(i);switch(e){case Oc:return a*t;case dh:return a*t/n.components*n.byteLength;case uh:return a*t/n.components*n.byteLength;case zn:return a*t*2/n.components*n.byteLength;case fh:return a*t*2/n.components*n.byteLength;case Hc:return a*t*3/n.components*n.byteLength;case Ii:return a*t*4/n.components*n.byteLength;case ph:return a*t*4/n.components*n.byteLength;case Ba:case Oa:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case Ha:case Ga:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case vo:case yo:return Math.max(a,16)*Math.max(t,8)/4;case go:case xo:return Math.max(a,8)*Math.max(t,8)/2;case _o:case Mo:case bo:case So:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case wo:case qa:case To:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case Eo:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case Ao:return Math.floor((a+4)/5)*Math.floor((t+3)/4)*16;case Ro:return Math.floor((a+4)/5)*Math.floor((t+4)/5)*16;case Co:return Math.floor((a+5)/6)*Math.floor((t+4)/5)*16;case Po:return Math.floor((a+5)/6)*Math.floor((t+5)/6)*16;case ko:return Math.floor((a+7)/8)*Math.floor((t+4)/5)*16;case Lo:return Math.floor((a+7)/8)*Math.floor((t+5)/6)*16;case Do:return Math.floor((a+7)/8)*Math.floor((t+7)/8)*16;case Io:return Math.floor((a+9)/10)*Math.floor((t+4)/5)*16;case No:return Math.floor((a+9)/10)*Math.floor((t+5)/6)*16;case Uo:return Math.floor((a+9)/10)*Math.floor((t+7)/8)*16;case Fo:return Math.floor((a+9)/10)*Math.floor((t+9)/10)*16;case zo:return Math.floor((a+11)/12)*Math.floor((t+9)/10)*16;case Bo:return Math.floor((a+11)/12)*Math.floor((t+11)/12)*16;case Oo:case Ho:case Go:return Math.ceil(a/4)*Math.ceil(t/4)*16;case Vo:case Wo:return Math.ceil(a/4)*Math.ceil(t/4)*8;case Ya:case Xo:return Math.ceil(a/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Qf(a){switch(a){case vi:case Uc:return{byteLength:1,components:1};case Xs:case Fc:case ci:return{byteLength:2,components:1};case lh:case ch:return{byteLength:2,components:4};case Zi:case hh:case Di:return{byteLength:4,components:1};case zc:case Bc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${a}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:eh}}));typeof window<"u"&&(window.__THREE__?Bt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=eh);function ud(){let a=null,t=!1,e=null,i=null;function n(s,r){i=a.requestAnimationFrame(n),e(s,r)}return{start:function(){t!==!0&&e!==null&&a!==null&&(i=a.requestAnimationFrame(n),t=!0)},stop:function(){a!==null&&a.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){a=s}}}function jf(a){const t=new WeakMap;function e(o,h){const l=o.array,c=o.usage,u=l.byteLength,d=a.createBuffer();a.bindBuffer(h,d),a.bufferData(h,l,c),o.onUploadCallback();let f;if(l instanceof Float32Array)f=a.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=a.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?f=a.HALF_FLOAT:f=a.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=a.SHORT;else if(l instanceof Uint32Array)f=a.UNSIGNED_INT;else if(l instanceof Int32Array)f=a.INT;else if(l instanceof Int8Array)f=a.BYTE;else if(l instanceof Uint8Array)f=a.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=a.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,h,l){const c=h.array,u=h.updateRanges;if(a.bindBuffer(l,o),u.length===0)a.bufferSubData(l,0,c);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){const m=u[d],v=u[f];v.start<=m.start+m.count+1?m.count=Math.max(m.count,v.start+v.count-m.start):(++d,u[d]=v)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){const v=u[f];a.bufferSubData(l,v.start*c.BYTES_PER_ELEMENT,c,v.start,v.count)}h.clearUpdateRanges()}h.onUploadCallback()}function n(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const h=t.get(o);h&&(a.deleteBuffer(h.buffer),t.delete(o))}function r(o,h){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const c=t.get(o);(!c||c.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,h));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,o,h),l.version=o.version}}return{get:n,remove:s,update:r}}var tp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ep=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ip=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,np=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ap=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,rp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,op=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,lp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,dp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,up=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,pp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,gp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,vp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,xp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,yp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,_p=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Mp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,wp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,bp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Sp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Tp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Ep=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ap=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Rp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Cp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Pp="gl_FragColor = linearToOutputTexel( gl_FragColor );",kp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Lp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Dp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Ip=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Np=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Up=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Fp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,zp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Op=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Gp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Wp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,qp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Yp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$p=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Zp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Jp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Qp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,t0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,e0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,i0=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,n0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,s0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,a0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,r0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,o0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,h0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,l0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,c0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,d0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,u0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,f0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,p0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,m0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,g0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,v0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,x0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,y0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,_0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,M0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,w0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,b0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,S0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,T0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,E0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,A0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,R0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,C0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,P0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,k0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,L0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,D0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,I0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,N0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,U0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,F0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,z0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,B0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,O0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,H0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,G0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,V0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,W0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,X0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,q0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Y0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,$0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Z0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,K0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,J0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Q0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,j0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const tm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,em=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,im=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,nm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,am=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,om=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,hm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,lm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,cm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,dm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,um=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,fm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,pm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,mm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ym=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_m=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Mm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,wm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Tm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Em=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Am=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Rm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Cm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Pm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,km=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Lm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Dm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Wt={alphahash_fragment:tp,alphahash_pars_fragment:ep,alphamap_fragment:ip,alphamap_pars_fragment:np,alphatest_fragment:sp,alphatest_pars_fragment:ap,aomap_fragment:rp,aomap_pars_fragment:op,batching_pars_vertex:hp,batching_vertex:lp,begin_vertex:cp,beginnormal_vertex:dp,bsdfs:up,iridescence_fragment:fp,bumpmap_pars_fragment:pp,clipping_planes_fragment:mp,clipping_planes_pars_fragment:gp,clipping_planes_pars_vertex:vp,clipping_planes_vertex:xp,color_fragment:yp,color_pars_fragment:_p,color_pars_vertex:Mp,color_vertex:wp,common:bp,cube_uv_reflection_fragment:Sp,defaultnormal_vertex:Tp,displacementmap_pars_vertex:Ep,displacementmap_vertex:Ap,emissivemap_fragment:Rp,emissivemap_pars_fragment:Cp,colorspace_fragment:Pp,colorspace_pars_fragment:kp,envmap_fragment:Lp,envmap_common_pars_fragment:Dp,envmap_pars_fragment:Ip,envmap_pars_vertex:Np,envmap_physical_pars_fragment:qp,envmap_vertex:Up,fog_vertex:Fp,fog_pars_vertex:zp,fog_fragment:Bp,fog_pars_fragment:Op,gradientmap_pars_fragment:Hp,lightmap_pars_fragment:Gp,lights_lambert_fragment:Vp,lights_lambert_pars_fragment:Wp,lights_pars_begin:Xp,lights_toon_fragment:Yp,lights_toon_pars_fragment:$p,lights_phong_fragment:Zp,lights_phong_pars_fragment:Kp,lights_physical_fragment:Jp,lights_physical_pars_fragment:Qp,lights_fragment_begin:jp,lights_fragment_maps:t0,lights_fragment_end:e0,lightprobes_pars_fragment:i0,logdepthbuf_fragment:n0,logdepthbuf_pars_fragment:s0,logdepthbuf_pars_vertex:a0,logdepthbuf_vertex:r0,map_fragment:o0,map_pars_fragment:h0,map_particle_fragment:l0,map_particle_pars_fragment:c0,metalnessmap_fragment:d0,metalnessmap_pars_fragment:u0,morphinstance_vertex:f0,morphcolor_vertex:p0,morphnormal_vertex:m0,morphtarget_pars_vertex:g0,morphtarget_vertex:v0,normal_fragment_begin:x0,normal_fragment_maps:y0,normal_pars_fragment:_0,normal_pars_vertex:M0,normal_vertex:w0,normalmap_pars_fragment:b0,clearcoat_normal_fragment_begin:S0,clearcoat_normal_fragment_maps:T0,clearcoat_pars_fragment:E0,iridescence_pars_fragment:A0,opaque_fragment:R0,packing:C0,premultiplied_alpha_fragment:P0,project_vertex:k0,dithering_fragment:L0,dithering_pars_fragment:D0,roughnessmap_fragment:I0,roughnessmap_pars_fragment:N0,shadowmap_pars_fragment:U0,shadowmap_pars_vertex:F0,shadowmap_vertex:z0,shadowmask_pars_fragment:B0,skinbase_vertex:O0,skinning_pars_vertex:H0,skinning_vertex:G0,skinnormal_vertex:V0,specularmap_fragment:W0,specularmap_pars_fragment:X0,tonemapping_fragment:q0,tonemapping_pars_fragment:Y0,transmission_fragment:$0,transmission_pars_fragment:Z0,uv_pars_fragment:K0,uv_pars_vertex:J0,uv_vertex:Q0,worldpos_vertex:j0,background_vert:tm,background_frag:em,backgroundCube_vert:im,backgroundCube_frag:nm,cube_vert:sm,cube_frag:am,depth_vert:rm,depth_frag:om,distance_vert:hm,distance_frag:lm,equirect_vert:cm,equirect_frag:dm,linedashed_vert:um,linedashed_frag:fm,meshbasic_vert:pm,meshbasic_frag:mm,meshlambert_vert:gm,meshlambert_frag:vm,meshmatcap_vert:xm,meshmatcap_frag:ym,meshnormal_vert:_m,meshnormal_frag:Mm,meshphong_vert:wm,meshphong_frag:bm,meshphysical_vert:Sm,meshphysical_frag:Tm,meshtoon_vert:Em,meshtoon_frag:Am,points_vert:Rm,points_frag:Cm,shadow_vert:Pm,shadow_frag:km,sprite_vert:Lm,sprite_frag:Dm},ft={common:{diffuse:{value:new Nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ht},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ht}},envmap:{envMap:{value:null},envMapRotation:{value:new Ht},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ht}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ht}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ht},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ht},normalScale:{value:new ht(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ht},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ht}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ht}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ht}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new C},probesMax:{value:new C},probesResolution:{value:new C}},points:{diffuse:{value:new Nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0},uvTransform:{value:new Ht}},sprite:{diffuse:{value:new Nt(16777215)},opacity:{value:1},center:{value:new ht(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ht},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0}}},Gi={basic:{uniforms:ti([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.fog]),vertexShader:Wt.meshbasic_vert,fragmentShader:Wt.meshbasic_frag},lambert:{uniforms:ti([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Nt(0)},envMapIntensity:{value:1}}]),vertexShader:Wt.meshlambert_vert,fragmentShader:Wt.meshlambert_frag},phong:{uniforms:ti([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Nt(0)},specular:{value:new Nt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Wt.meshphong_vert,fragmentShader:Wt.meshphong_frag},standard:{uniforms:ti([ft.common,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.roughnessmap,ft.metalnessmap,ft.fog,ft.lights,{emissive:{value:new Nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Wt.meshphysical_vert,fragmentShader:Wt.meshphysical_frag},toon:{uniforms:ti([ft.common,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.gradientmap,ft.fog,ft.lights,{emissive:{value:new Nt(0)}}]),vertexShader:Wt.meshtoon_vert,fragmentShader:Wt.meshtoon_frag},matcap:{uniforms:ti([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,{matcap:{value:null}}]),vertexShader:Wt.meshmatcap_vert,fragmentShader:Wt.meshmatcap_frag},points:{uniforms:ti([ft.points,ft.fog]),vertexShader:Wt.points_vert,fragmentShader:Wt.points_frag},dashed:{uniforms:ti([ft.common,ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Wt.linedashed_vert,fragmentShader:Wt.linedashed_frag},depth:{uniforms:ti([ft.common,ft.displacementmap]),vertexShader:Wt.depth_vert,fragmentShader:Wt.depth_frag},normal:{uniforms:ti([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,{opacity:{value:1}}]),vertexShader:Wt.meshnormal_vert,fragmentShader:Wt.meshnormal_frag},sprite:{uniforms:ti([ft.sprite,ft.fog]),vertexShader:Wt.sprite_vert,fragmentShader:Wt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ht},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Wt.background_vert,fragmentShader:Wt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ht}},vertexShader:Wt.backgroundCube_vert,fragmentShader:Wt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Wt.cube_vert,fragmentShader:Wt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Wt.equirect_vert,fragmentShader:Wt.equirect_frag},distance:{uniforms:ti([ft.common,ft.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Wt.distance_vert,fragmentShader:Wt.distance_frag},shadow:{uniforms:ti([ft.lights,ft.fog,{color:{value:new Nt(0)},opacity:{value:1}}]),vertexShader:Wt.shadow_vert,fragmentShader:Wt.shadow_frag}};Gi.physical={uniforms:ti([Gi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ht},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ht},clearcoatNormalScale:{value:new ht(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ht},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ht},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ht},sheen:{value:0},sheenColor:{value:new Nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ht},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ht},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ht},transmissionSamplerSize:{value:new ht},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ht},attenuationDistance:{value:0},attenuationColor:{value:new Nt(0)},specularColor:{value:new Nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ht},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ht},anisotropyVector:{value:new ht},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ht}}]),vertexShader:Wt.meshphysical_vert,fragmentShader:Wt.meshphysical_frag};const Ca={r:0,b:0,g:0},Im=new pe,fd=new Ht;fd.set(-1,0,0,0,1,0,0,0,1);function Nm(a,t,e,i,n,s){const r=new Nt(0);let o=n===!0?0:1,h,l,c=null,u=0,d=null;function f(y){let b=y.isScene===!0?y.background:null;if(b&&b.isTexture){const x=y.backgroundBlurriness>0;b=t.get(b,x)}return b}function m(y){let b=!1;const x=f(y);x===null?p(r,o):x&&x.isColor&&(p(x,1),b=!0);const S=a.xr.getEnvironmentBlendMode();S==="additive"?e.buffers.color.setClear(0,0,0,1,s):S==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,s),(a.autoClear||b)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),a.clear(a.autoClearColor,a.autoClearDepth,a.autoClearStencil))}function v(y,b){const x=f(b);x&&(x.isCubeTexture||x.mapping===ir)?(l===void 0&&(l=new J(new ke(1,1,1),new Be({name:"BackgroundCubeMaterial",uniforms:fs(Gi.backgroundCube.uniforms),vertexShader:Gi.backgroundCube.vertexShader,fragmentShader:Gi.backgroundCube.fragmentShader,side:ei,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(S,T,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=x,l.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Im.makeRotationFromEuler(b.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(fd),l.material.toneMapped=Kt.getTransfer(x.colorSpace)!==fe,(c!==x||u!==x.version||d!==a.toneMapping)&&(l.material.needsUpdate=!0,c=x,u=x.version,d=a.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null)):x&&x.isTexture&&(h===void 0&&(h=new J(new Tn(2,2),new Be({name:"BackgroundMaterial",uniforms:fs(Gi.background.uniforms),vertexShader:Gi.background.vertexShader,fragmentShader:Gi.background.fragmentShader,side:Sn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(h)),h.material.uniforms.t2D.value=x,h.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,h.material.toneMapped=Kt.getTransfer(x.colorSpace)!==fe,x.matrixAutoUpdate===!0&&x.updateMatrix(),h.material.uniforms.uvTransform.value.copy(x.matrix),(c!==x||u!==x.version||d!==a.toneMapping)&&(h.material.needsUpdate=!0,c=x,u=x.version,d=a.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null))}function p(y,b){y.getRGB(Ca,od(a)),e.buffers.color.setClear(Ca.r,Ca.g,Ca.b,b,s)}function g(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0)}return{getClearColor:function(){return r},setClearColor:function(y,b=1){r.set(y),o=b,p(r,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,p(r,o)},render:m,addToRenderList:v,dispose:g}}function Um(a,t){const e=a.getParameter(a.MAX_VERTEX_ATTRIBS),i={},n=d(null);let s=n,r=!1;function o(N,k,D,I,P){let B=!1;const O=u(N,I,D,k);s!==O&&(s=O,l(s.object)),B=f(N,I,D,P),B&&m(N,I,D,P),P!==null&&t.update(P,a.ELEMENT_ARRAY_BUFFER),(B||r)&&(r=!1,x(N,k,D,I),P!==null&&a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,t.get(P).buffer))}function h(){return a.createVertexArray()}function l(N){return a.bindVertexArray(N)}function c(N){return a.deleteVertexArray(N)}function u(N,k,D,I){const P=I.wireframe===!0;let B=i[k.id];B===void 0&&(B={},i[k.id]=B);const O=N.isInstancedMesh===!0?N.id:0;let j=B[O];j===void 0&&(j={},B[O]=j);let q=j[D.id];q===void 0&&(q={},j[D.id]=q);let tt=q[P];return tt===void 0&&(tt=d(h()),q[P]=tt),tt}function d(N){const k=[],D=[],I=[];for(let P=0;P<e;P++)k[P]=0,D[P]=0,I[P]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:k,enabledAttributes:D,attributeDivisors:I,object:N,attributes:{},index:null}}function f(N,k,D,I){const P=s.attributes,B=k.attributes;let O=0;const j=D.getAttributes();for(const q in j)if(j[q].location>=0){const it=P[q];let It=B[q];if(It===void 0&&(q==="instanceMatrix"&&N.instanceMatrix&&(It=N.instanceMatrix),q==="instanceColor"&&N.instanceColor&&(It=N.instanceColor)),it===void 0||it.attribute!==It||It&&it.data!==It.data)return!0;O++}return s.attributesNum!==O||s.index!==I}function m(N,k,D,I){const P={},B=k.attributes;let O=0;const j=D.getAttributes();for(const q in j)if(j[q].location>=0){let it=B[q];it===void 0&&(q==="instanceMatrix"&&N.instanceMatrix&&(it=N.instanceMatrix),q==="instanceColor"&&N.instanceColor&&(it=N.instanceColor));const It={};It.attribute=it,it&&it.data&&(It.data=it.data),P[q]=It,O++}s.attributes=P,s.attributesNum=O,s.index=I}function v(){const N=s.newAttributes;for(let k=0,D=N.length;k<D;k++)N[k]=0}function p(N){g(N,0)}function g(N,k){const D=s.newAttributes,I=s.enabledAttributes,P=s.attributeDivisors;D[N]=1,I[N]===0&&(a.enableVertexAttribArray(N),I[N]=1),P[N]!==k&&(a.vertexAttribDivisor(N,k),P[N]=k)}function y(){const N=s.newAttributes,k=s.enabledAttributes;for(let D=0,I=k.length;D<I;D++)k[D]!==N[D]&&(a.disableVertexAttribArray(D),k[D]=0)}function b(N,k,D,I,P,B,O){O===!0?a.vertexAttribIPointer(N,k,D,P,B):a.vertexAttribPointer(N,k,D,I,P,B)}function x(N,k,D,I){v();const P=I.attributes,B=D.getAttributes(),O=k.defaultAttributeValues;for(const j in B){const q=B[j];if(q.location>=0){let tt=P[j];if(tt===void 0&&(j==="instanceMatrix"&&N.instanceMatrix&&(tt=N.instanceMatrix),j==="instanceColor"&&N.instanceColor&&(tt=N.instanceColor)),tt!==void 0){const it=tt.normalized,It=tt.itemSize,Tt=t.get(tt);if(Tt===void 0)continue;const ce=Tt.buffer,Qt=Tt.type,oe=Tt.bytesPerElement,$=Qt===a.INT||Qt===a.UNSIGNED_INT||tt.gpuType===hh;if(tt.isInterleavedBufferAttribute){const et=tt.data,wt=et.stride,Ot=tt.offset;if(et.isInstancedInterleavedBuffer){for(let _t=0;_t<q.locationSize;_t++)g(q.location+_t,et.meshPerAttribute);N.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=et.meshPerAttribute*et.count)}else for(let _t=0;_t<q.locationSize;_t++)p(q.location+_t);a.bindBuffer(a.ARRAY_BUFFER,ce);for(let _t=0;_t<q.locationSize;_t++)b(q.location+_t,It/q.locationSize,Qt,it,wt*oe,(Ot+It/q.locationSize*_t)*oe,$)}else{if(tt.isInstancedBufferAttribute){for(let et=0;et<q.locationSize;et++)g(q.location+et,tt.meshPerAttribute);N.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let et=0;et<q.locationSize;et++)p(q.location+et);a.bindBuffer(a.ARRAY_BUFFER,ce);for(let et=0;et<q.locationSize;et++)b(q.location+et,It/q.locationSize,Qt,it,It*oe,It/q.locationSize*et*oe,$)}}else if(O!==void 0){const it=O[j];if(it!==void 0)switch(it.length){case 2:a.vertexAttrib2fv(q.location,it);break;case 3:a.vertexAttrib3fv(q.location,it);break;case 4:a.vertexAttrib4fv(q.location,it);break;default:a.vertexAttrib1fv(q.location,it)}}}}y()}function S(){E();for(const N in i){const k=i[N];for(const D in k){const I=k[D];for(const P in I){const B=I[P];for(const O in B)c(B[O].object),delete B[O];delete I[P]}}delete i[N]}}function T(N){if(i[N.id]===void 0)return;const k=i[N.id];for(const D in k){const I=k[D];for(const P in I){const B=I[P];for(const O in B)c(B[O].object),delete B[O];delete I[P]}}delete i[N.id]}function R(N){for(const k in i){const D=i[k];for(const I in D){const P=D[I];if(P[N.id]===void 0)continue;const B=P[N.id];for(const O in B)c(B[O].object),delete B[O];delete P[N.id]}}}function M(N){for(const k in i){const D=i[k],I=N.isInstancedMesh===!0?N.id:0,P=D[I];if(P!==void 0){for(const B in P){const O=P[B];for(const j in O)c(O[j].object),delete O[j];delete P[B]}delete D[I],Object.keys(D).length===0&&delete i[k]}}}function E(){L(),r=!0,s!==n&&(s=n,l(s.object))}function L(){n.geometry=null,n.program=null,n.wireframe=!1}return{setup:o,reset:E,resetDefaultState:L,dispose:S,releaseStatesOfGeometry:T,releaseStatesOfObject:M,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:p,disableUnusedAttributes:y}}function Fm(a,t,e){let i;function n(h){i=h}function s(h,l){a.drawArrays(i,h,l),e.update(l,i,1)}function r(h,l,c){c!==0&&(a.drawArraysInstanced(i,h,l,c),e.update(l,i,c))}function o(h,l,c){if(c===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,h,0,l,0,c);let d=0;for(let f=0;f<c;f++)d+=l[f];e.update(d,i,1)}this.setMode=n,this.render=s,this.renderInstances=r,this.renderMultiDraw=o}function zm(a,t,e,i){let n;function s(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){const R=t.get("EXT_texture_filter_anisotropic");n=a.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(R){return!(R!==Ii&&i.convert(R)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const M=R===ci&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==vi&&R!==Di&&!M&&i.convert(R)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_TYPE))}function h(R){if(R==="highp"){if(a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.HIGH_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.MEDIUM_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const c=h(l);c!==l&&(Bt("WebGLRenderer:",l,"not supported, using",c,"instead."),l=c);const u=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&d===!1&&Bt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS),m=a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=a.getParameter(a.MAX_TEXTURE_SIZE),p=a.getParameter(a.MAX_CUBE_MAP_TEXTURE_SIZE),g=a.getParameter(a.MAX_VERTEX_ATTRIBS),y=a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS),b=a.getParameter(a.MAX_VARYING_VECTORS),x=a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS),S=a.getParameter(a.MAX_SAMPLES),T=a.getParameter(a.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:h,textureFormatReadable:r,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:v,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:y,maxVaryings:b,maxFragmentUniforms:x,maxSamples:S,samples:T}}function Bm(a){const t=this;let e=null,i=0,n=!1,s=!1;const r=new _n,o=new Ht,h={value:null,needsUpdate:!1};this.uniform=h,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||i!==0||n;return n=d,i=u.length,f},this.beginShadows=function(){s=!0,c(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){e=c(u,d,0)},this.setState=function(u,d,f){const m=u.clippingPlanes,v=u.clipIntersection,p=u.clipShadows,g=a.get(u);if(!n||m===null||m.length===0||s&&!p)s?c(null):l();else{const y=s?0:i,b=y*4;let x=g.clippingState||null;h.value=x,x=c(m,d,b,f);for(let S=0;S!==b;++S)x[S]=e[S];g.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function l(){h.value!==e&&(h.value=e,h.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function c(u,d,f,m){const v=u!==null?u.length:0;let p=null;if(v!==0){if(p=h.value,m!==!0||p===null){const g=f+v*4,y=d.matrixWorldInverse;o.getNormalMatrix(y),(p===null||p.length<g)&&(p=new Float32Array(g));for(let b=0,x=f;b!==v;++b,x+=4)r.copy(u[b]).applyMatrix4(y,o),r.normal.toArray(p,x),p[x+3]=r.constant}h.value=p,h.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,p}}const hs=4,Om=6,Hm=20,Gm=256,Ps=new sr,Al=new Nt;let Or=null,Hr=0,Gr=0,Vr=!1;const Vm=new C,kn=new C;class Rl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,i=.1,n=100,s={}){const{size:r=256,position:o=Vm}=s;Or=this._renderer.getRenderTarget(),Hr=this._renderer.getActiveCubeFace(),Gr=this._renderer.getActiveMipmapLevel(),Vr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);const h=this._allocateTargets();return h.depthBuffer=!0,this._sceneToCubeUV(t,i,n,h,o),e>0&&this._blur(h,0,0,e),this._applyPMREM(h),this._cleanup(h),h}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=kl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Pl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Or,Hr,Gr),this._renderer.xr.enabled=Vr,t.scissorTest=!1,as(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Fn||t.mapping===ds?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Or=this._renderer.getRenderTarget(),Hr=this._renderer.getActiveCubeFace(),Gr=this._renderer.getActiveMipmapLevel(),Vr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:Qe,minFilter:Qe,generateMipmaps:!1,type:ci,format:Ii,colorSpace:$a,depthBuffer:!1},n=Cl(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cl(t,e,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Wm(s)),this._blurMaterial=qm(s,t,e),this._ggxMaterial=Xm(s,t,e)}return n}_compileMaterial(t){const e=new J(new Se,t);this._renderer.compile(e,Ps)}_sceneToCubeUV(t,e,i,n,s){const h=new gi(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(Al),u.toneMapping=Yi,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(n),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new J(new ke,new si({name:"PMREM.Background",side:ei,depthWrite:!1,depthTest:!1})));const v=this._backgroundBox,p=v.material;let g=!1;const y=t.background;y?y.isColor&&(p.color.copy(y),t.background=null,g=!0):(p.color.copy(Al),g=!0);for(let b=0;b<6;b++){const x=b%3;x===0?(h.up.set(0,l[b],0),h.position.set(s.x,s.y,s.z),h.lookAt(s.x+c[b],s.y,s.z)):x===1?(h.up.set(0,0,l[b]),h.position.set(s.x,s.y,s.z),h.lookAt(s.x,s.y+c[b],s.z)):(h.up.set(0,l[b],0),h.position.set(s.x,s.y,s.z),h.lookAt(s.x,s.y,s.z+c[b]));const S=this._cubeSize;as(n,x*S,b>2?S:0,S,S),u.setRenderTarget(n),g&&u.render(v,h),u.render(t,h)}u.toneMapping=f,u.autoClear=d,t.background=y}_textureToCubeUV(t,e){const i=this._renderer,n=t.mapping===Fn||t.mapping===ds;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=kl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Pl());const s=n?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=s;const o=s.uniforms;o.envMap.value=t;const h=this._cubeSize;as(e,0,0,3*h,2*h),i.setRenderTarget(e),i.render(r,Ps)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;const n=this._lodMeshes.length;for(let s=1;s<n;s++)this._applyGGXFilter(t,s-1,s);e.autoClear=i}_applyGGXFilter(t,e,i){const n=this._renderer,s=this._pingPongRenderTarget,r=this._ggxMaterial,o=this._lodMeshes[i];o.material=r;const h=r.uniforms,l=i/(this._lodMeshes.length-1),c=e/(this._lodMeshes.length-1),u=Math.sqrt(l*l-c*c),d=l*1.25,f=u*d,{_lodMax:m}=this,v=this._sizeLods[i],p=3*v*(i>m-hs?i-m+hs:0),g=4*(this._cubeSize-v);h.envMap.value=t.texture,h.roughness.value=f,h.mipInt.value=m-e,as(s,p,g,3*v,2*v),n.setRenderTarget(s),n.render(o,Ps),h.envMap.value=s.texture,h.roughness.value=0,h.mipInt.value=m-i,as(t,p,g,3*v,2*v),n.setRenderTarget(t),n.render(o,Ps)}_blur(t,e,i,n){const s=this._pingPongRenderTarget,r=Math.min(n,Math.PI)/Math.SQRT2;this._blurPass(t,s,e,i,r),this._blurPass(s,t,i,i,r)}_blurPass(t,e,i,n,s){const r=this._renderer,o=this._blurMaterial,h=this._lodMeshes[n];h.material=o;const l=o.uniforms;l.envMap.value=t.texture,l.sigma.value=s,l.mipInt.value=this._lodMax-i;const c=this._sizeLods[n],u=3*c*(n>this._lodMax-hs?n-this._lodMax+hs:0),d=4*(this._cubeSize-c);as(e,u,d,3*c,2*c),r.setRenderTarget(e),r.render(h,Ps)}}function Wm(a){const t=[],e=[];let i=a;const n=a-hs+1+Om;for(let s=0;s<n;s++){const r=Math.pow(2,i);t.push(r);const o=1/(r-2),h=-o,l=1+o,c=[h,h,l,h,l,l,h,h,l,l,h,l],u=6,d=6,f=3,m=new Float32Array(f*d*u),v=new Float32Array(f*d*u);for(let g=0;g<u;g++){const y=g%3*2/3-1,b=g>2?0:-1,x=[y,b,0,y+2/3,b,0,y+2/3,b+1,0,y,b,0,y+2/3,b+1,0,y,b+1,0];m.set(x,f*d*g);for(let S=0;S<d;S++){const T=c[S*2]*2-1,R=c[S*2+1]*2-1;g===0?kn.set(1,R,T):g===1?kn.set(-T,1,-R):g===2?kn.set(-T,R,1):g===3?kn.set(-1,R,-T):g===4?kn.set(-T,-1,R):kn.set(T,R,-1),kn.toArray(v,(g*d+S)*f)}}const p=new Se;p.setAttribute("position",new qe(m,f)),p.setAttribute("outputDirection",new qe(v,f)),e.push(new J(p,null)),i>hs&&i--}return{lodMeshes:e,sizeLods:t}}function Cl(a,t,e){const i=new ni(a,t,e);return i.texture.mapping=ir,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function as(a,t,e,i,n){a.viewport.set(t,e,i,n),a.scissor.set(t,e,i,n)}function Xm(a,t,e){return new Be({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Gm,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ar(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:qi,depthTest:!1,depthWrite:!1})}function qm(a,t,e){return new Be({name:"SphericalGaussianBlur",defines:{SAMPLES:Hm,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ar(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:qi,depthTest:!1,depthWrite:!1})}function Pl(){return new Be({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ar(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:qi,depthTest:!1,depthWrite:!1})}function kl(){return new Be({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ar(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:qi,depthTest:!1,depthWrite:!1})}function ar(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class pd extends ni{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},n=[i,i,i,i,i,i];this.texture=new Kc(n),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new ke(5,5,5),s=new Be({name:"CubemapFromEquirect",uniforms:fs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:ei,blending:qi});s.uniforms.tEquirect.value=e;const r=new J(n,s),o=e.minFilter;return e.minFilter===In&&(e.minFilter=Qe),new $f(1,10,this).update(t,r),e.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,e=!0,i=!0,n=!0){const s=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,i,n);t.setRenderTarget(s)}}function Ym(a){let t=new WeakMap,e=new WeakMap,i=null;function n(d,f=!1){return d==null?null:f?r(d):s(d)}function s(d){if(d&&d.isTexture){const f=d.mapping;if(f===lr||f===cr)if(t.has(d)){const m=t.get(d).texture;return o(m,d.mapping)}else{const m=d.image;if(m&&m.height>0){const v=new pd(m.height);return v.fromEquirectangularTexture(a,d),t.set(d,v),d.addEventListener("dispose",l),o(v.texture,d.mapping)}else return null}}return d}function r(d){if(d&&d.isTexture){const f=d.mapping,m=f===lr||f===cr,v=f===Fn||f===ds;if(m||v){let p=e.get(d);const g=p!==void 0?p.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==g)return i===null&&(i=new Rl(a)),p=m?i.fromEquirectangular(d,p):i.fromCubemap(d,p),p.texture.pmremVersion=d.pmremVersion,e.set(d,p),p.texture;if(p!==void 0)return p.texture;{const y=d.image;return m&&y&&y.height>0||v&&y&&h(y)?(i===null&&(i=new Rl(a)),p=m?i.fromEquirectangular(d):i.fromCubemap(d),p.texture.pmremVersion=d.pmremVersion,e.set(d,p),d.addEventListener("dispose",c),p.texture):null}}}return d}function o(d,f){return f===lr?d.mapping=Fn:f===cr&&(d.mapping=ds),d}function h(d){let f=0;const m=6;for(let v=0;v<m;v++)d[v]!==void 0&&f++;return f===m}function l(d){const f=d.target;f.removeEventListener("dispose",l);const m=t.get(f);m!==void 0&&(t.delete(f),m.dispose())}function c(d){const f=d.target;f.removeEventListener("dispose",c);const m=e.get(f);m!==void 0&&(e.delete(f),m.dispose())}function u(){t=new WeakMap,e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:n,dispose:u}}function $m(a){const t={};function e(i){if(t[i]!==void 0)return t[i];const n=a.getExtension(i);return t[i]=n,n}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const n=e(i);return n===null&&ls("WebGLRenderer: "+i+" extension not supported."),n}}}function Zm(a,t,e,i){const n={},s=new WeakMap;function r(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const m in d.attributes)t.remove(d.attributes[m]);d.removeEventListener("dispose",r),delete n[d.id];const f=s.get(d);f&&(t.remove(f),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(u,d){return n[d.id]===!0||(d.addEventListener("dispose",r),n[d.id]=!0,e.memory.geometries++),d}function h(u){const d=u.attributes;for(const f in d)t.update(d[f],a.ARRAY_BUFFER)}function l(u){const d=[],f=u.index,m=u.attributes.position;let v=0;if(m===void 0)return;if(f!==null){const y=f.array;v=f.version;for(let b=0,x=y.length;b<x;b+=3){const S=y[b+0],T=y[b+1],R=y[b+2];d.push(S,T,T,R,R,S)}}else{const y=m.array;v=m.version;for(let b=0,x=y.length/3-1;b<x;b+=3){const S=b+0,T=b+1,R=b+2;d.push(S,T,T,R,R,S)}}const p=new(m.count>=65535?Yc:qc)(d,1);p.version=v;const g=s.get(u);g&&t.remove(g),s.set(u,p)}function c(u){const d=s.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return s.get(u)}return{get:o,update:h,getWireframeAttribute:c}}function Km(a,t,e){let i;function n(u){i=u}let s,r;function o(u){s=u.type,r=u.bytesPerElement}function h(u,d){a.drawElements(i,d,s,u*r),e.update(d,i,1)}function l(u,d,f){f!==0&&(a.drawElementsInstanced(i,d,s,u*r,f),e.update(d,i,f))}function c(u,d,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,d,0,s,u,0,f);let v=0;for(let p=0;p<f;p++)v+=d[p];e.update(v,i,1)}this.setMode=n,this.setIndex=o,this.render=h,this.renderInstances=l,this.renderMultiDraw=c}function Jm(a){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,r,o){switch(e.calls++,r){case a.TRIANGLES:e.triangles+=o*(s/3);break;case a.LINES:e.lines+=o*(s/2);break;case a.LINE_STRIP:e.lines+=o*(s-1);break;case a.LINE_LOOP:e.lines+=o*s;break;case a.POINTS:e.points+=o*s;break;default:re("WebGLInfo: Unknown draw mode:",r);break}}function n(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:n,update:i}}function Qm(a,t,e){const i=new WeakMap,n=new Re;function s(r,o,h){const l=r.morphTargetInfluences,c=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=c!==void 0?c.length:0;let d=i.get(o);if(d===void 0||d.count!==u){let L=function(){M.dispose(),i.delete(o),o.removeEventListener("dispose",L)};var f=L;d!==void 0&&d.texture.dispose();const m=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,p=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],y=o.morphAttributes.normal||[],b=o.morphAttributes.color||[];let x=0;m===!0&&(x=1),v===!0&&(x=2),p===!0&&(x=3);let S=o.attributes.position.count*x,T=1;S>t.maxTextureSize&&(T=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const R=new Float32Array(S*T*4*u),M=new Vc(R,S,T,u);M.type=Di,M.needsUpdate=!0;const E=x*4;for(let N=0;N<u;N++){const k=g[N],D=y[N],I=b[N],P=S*T*4*N;for(let B=0;B<k.count;B++){const O=B*E;m===!0&&(n.fromBufferAttribute(k,B),R[P+O+0]=n.x,R[P+O+1]=n.y,R[P+O+2]=n.z,R[P+O+3]=0),v===!0&&(n.fromBufferAttribute(D,B),R[P+O+4]=n.x,R[P+O+5]=n.y,R[P+O+6]=n.z,R[P+O+7]=0),p===!0&&(n.fromBufferAttribute(I,B),R[P+O+8]=n.x,R[P+O+9]=n.y,R[P+O+10]=n.z,R[P+O+11]=I.itemSize===4?n.w:1)}}d={count:u,texture:M,size:new ht(S,T)},i.set(o,d),o.addEventListener("dispose",L)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)h.getUniforms().setValue(a,"morphTexture",r.morphTexture,e);else{let m=0;for(let p=0;p<l.length;p++)m+=l[p];const v=o.morphTargetsRelative?1:1-m;h.getUniforms().setValue(a,"morphTargetBaseInfluence",v),h.getUniforms().setValue(a,"morphTargetInfluences",l)}h.getUniforms().setValue(a,"morphTargetsTexture",d.texture,e),h.getUniforms().setValue(a,"morphTargetsTextureSize",d.size)}return{update:s}}function jm(a,t,e,i,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,d=t.get(l,u);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",h)===!1&&l.addEventListener("dispose",h),s.get(l)!==c&&(e.update(l.instanceMatrix,a.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,a.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return d}function o(){s=new WeakMap}function h(l){const c=l.target;c.removeEventListener("dispose",h),i.releaseStatesOfObject(c),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}const tg={[ih]:"LINEAR_TONE_MAPPING",[nh]:"REINHARD_TONE_MAPPING",[sh]:"CINEON_TONE_MAPPING",[er]:"ACES_FILMIC_TONE_MAPPING",[rh]:"AGX_TONE_MAPPING",[oh]:"NEUTRAL_TONE_MAPPING",[ah]:"CUSTOM_TONE_MAPPING"};function eg(a,t,e,i,n,s){const r=new ni(t,e,{type:a,depthBuffer:n,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,h=null;const l=new Se;l.setAttribute("position",new Jt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new Jt([0,2,0,0,2,0],2));const c=new hd({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new J(l,c),d=new sr(-1,1,1,-1,0,1);let f=null,m=null,v=!1,p,g=null,y=[],b=!1;this.setSize=function(x,S){r.setSize(x,S),o!==null&&o.setSize(x,S),h!==null&&h.setSize(x,S);for(let T=0;T<y.length;T++){const R=y[T];R.setSize&&R.setSize(x,S)}},this.setEffects=function(x){y=x,b=y.length>0&&y[0].isRenderPass===!0;const S=r.width,T=r.height;y.length>0&&o===null&&(o=new ni(S,T,{type:ci,depthBuffer:!1,stencilBuffer:!1}),h=new ni(S,T,{type:ci,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<y.length;R++){const M=y[R];M.setSize&&M.setSize(S,T)}},this.begin=function(x,S){if(v||x.toneMapping===Yi&&y.length===0)return!1;if(g=S,S!==null){const T=S.width,R=S.height;(r.width!==T||r.height!==R)&&this.setSize(T,R)}return b===!1&&x.setRenderTarget(r),p=x.toneMapping,x.toneMapping=Yi,!0},this.hasRenderPass=function(){return b},this.end=function(x,S){x.toneMapping=p,v=!0;let T=r,R=o;for(let M=0;M<y.length;M++){const E=y[M];E.enabled!==!1&&(E.render(x,R,T,S),E.needsSwap!==!1&&(T=R,R=R===o?h:o))}if(f!==x.outputColorSpace||m!==x.toneMapping){f=x.outputColorSpace,m=x.toneMapping,c.defines={},Kt.getTransfer(f)===fe&&(c.defines.SRGB_TRANSFER="");const M=tg[m];M&&(c.defines[M]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=T.texture,x.setRenderTarget(g),x.render(u,d),g=null,v=!1},this.isCompositing=function(){return v},this.dispose=function(){r.dispose(),o!==null&&o.dispose(),h!==null&&h.dispose(),l.dispose(),c.dispose()}}const md=new ii,Jo=new $s(1,1),gd=new Vc,vd=new zu,xd=new Kc,Ll=[],Dl=[],Il=new Float32Array(16),Nl=new Float32Array(9),Ul=new Float32Array(4);function _s(a,t,e){const i=a[0];if(i<=0||i>0)return a;const n=t*e;let s=Ll[n];if(s===void 0&&(s=new Float32Array(n),Ll[n]=s),t!==0){i.toArray(s,0);for(let r=1,o=0;r!==t;++r)o+=e,a[r].toArray(s,o)}return s}function Oe(a,t){if(a.length!==t.length)return!1;for(let e=0,i=a.length;e<i;e++)if(a[e]!==t[e])return!1;return!0}function He(a,t){for(let e=0,i=t.length;e<i;e++)a[e]=t[e]}function rr(a,t){let e=Dl[t];e===void 0&&(e=new Int32Array(t),Dl[t]=e);for(let i=0;i!==t;++i)e[i]=a.allocateTextureUnit();return e}function ig(a,t){const e=this.cache;e[0]!==t&&(a.uniform1f(this.addr,t),e[0]=t)}function ng(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Oe(e,t))return;a.uniform2fv(this.addr,t),He(e,t)}}function sg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(a.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Oe(e,t))return;a.uniform3fv(this.addr,t),He(e,t)}}function ag(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Oe(e,t))return;a.uniform4fv(this.addr,t),He(e,t)}}function rg(a,t){const e=this.cache,i=t.elements;if(i===void 0){if(Oe(e,t))return;a.uniformMatrix2fv(this.addr,!1,t),He(e,t)}else{if(Oe(e,i))return;Ul.set(i),a.uniformMatrix2fv(this.addr,!1,Ul),He(e,i)}}function og(a,t){const e=this.cache,i=t.elements;if(i===void 0){if(Oe(e,t))return;a.uniformMatrix3fv(this.addr,!1,t),He(e,t)}else{if(Oe(e,i))return;Nl.set(i),a.uniformMatrix3fv(this.addr,!1,Nl),He(e,i)}}function hg(a,t){const e=this.cache,i=t.elements;if(i===void 0){if(Oe(e,t))return;a.uniformMatrix4fv(this.addr,!1,t),He(e,t)}else{if(Oe(e,i))return;Il.set(i),a.uniformMatrix4fv(this.addr,!1,Il),He(e,i)}}function lg(a,t){const e=this.cache;e[0]!==t&&(a.uniform1i(this.addr,t),e[0]=t)}function cg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Oe(e,t))return;a.uniform2iv(this.addr,t),He(e,t)}}function dg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Oe(e,t))return;a.uniform3iv(this.addr,t),He(e,t)}}function ug(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Oe(e,t))return;a.uniform4iv(this.addr,t),He(e,t)}}function fg(a,t){const e=this.cache;e[0]!==t&&(a.uniform1ui(this.addr,t),e[0]=t)}function pg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Oe(e,t))return;a.uniform2uiv(this.addr,t),He(e,t)}}function mg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Oe(e,t))return;a.uniform3uiv(this.addr,t),He(e,t)}}function gg(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Oe(e,t))return;a.uniform4uiv(this.addr,t),He(e,t)}}function vg(a,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n);let s;this.type===a.SAMPLER_2D_SHADOW?(Jo.compareFunction=e.isReversedDepthBuffer()?gh:mh,s=Jo):s=md,e.setTexture2D(t||s,n)}function xg(a,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTexture3D(t||vd,n)}function yg(a,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTextureCube(t||xd,n)}function _g(a,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),e.setTexture2DArray(t||gd,n)}function Mg(a){switch(a){case 5126:return ig;case 35664:return ng;case 35665:return sg;case 35666:return ag;case 35674:return rg;case 35675:return og;case 35676:return hg;case 5124:case 35670:return lg;case 35667:case 35671:return cg;case 35668:case 35672:return dg;case 35669:case 35673:return ug;case 5125:return fg;case 36294:return pg;case 36295:return mg;case 36296:return gg;case 35678:case 36198:case 36298:case 36306:case 35682:return vg;case 35679:case 36299:case 36307:return xg;case 35680:case 36300:case 36308:case 36293:return yg;case 36289:case 36303:case 36311:case 36292:return _g}}function wg(a,t){a.uniform1fv(this.addr,t)}function bg(a,t){const e=_s(t,this.size,2);a.uniform2fv(this.addr,e)}function Sg(a,t){const e=_s(t,this.size,3);a.uniform3fv(this.addr,e)}function Tg(a,t){const e=_s(t,this.size,4);a.uniform4fv(this.addr,e)}function Eg(a,t){const e=_s(t,this.size,4);a.uniformMatrix2fv(this.addr,!1,e)}function Ag(a,t){const e=_s(t,this.size,9);a.uniformMatrix3fv(this.addr,!1,e)}function Rg(a,t){const e=_s(t,this.size,16);a.uniformMatrix4fv(this.addr,!1,e)}function Cg(a,t){a.uniform1iv(this.addr,t)}function Pg(a,t){a.uniform2iv(this.addr,t)}function kg(a,t){a.uniform3iv(this.addr,t)}function Lg(a,t){a.uniform4iv(this.addr,t)}function Dg(a,t){a.uniform1uiv(this.addr,t)}function Ig(a,t){a.uniform2uiv(this.addr,t)}function Ng(a,t){a.uniform3uiv(this.addr,t)}function Ug(a,t){a.uniform4uiv(this.addr,t)}function Fg(a,t,e){const i=this.cache,n=t.length,s=rr(e,n);Oe(i,s)||(a.uniform1iv(this.addr,s),He(i,s));let r;this.type===a.SAMPLER_2D_SHADOW?r=Jo:r=md;for(let o=0;o!==n;++o)e.setTexture2D(t[o]||r,s[o])}function zg(a,t,e){const i=this.cache,n=t.length,s=rr(e,n);Oe(i,s)||(a.uniform1iv(this.addr,s),He(i,s));for(let r=0;r!==n;++r)e.setTexture3D(t[r]||vd,s[r])}function Bg(a,t,e){const i=this.cache,n=t.length,s=rr(e,n);Oe(i,s)||(a.uniform1iv(this.addr,s),He(i,s));for(let r=0;r!==n;++r)e.setTextureCube(t[r]||xd,s[r])}function Og(a,t,e){const i=this.cache,n=t.length,s=rr(e,n);Oe(i,s)||(a.uniform1iv(this.addr,s),He(i,s));for(let r=0;r!==n;++r)e.setTexture2DArray(t[r]||gd,s[r])}function Hg(a){switch(a){case 5126:return wg;case 35664:return bg;case 35665:return Sg;case 35666:return Tg;case 35674:return Eg;case 35675:return Ag;case 35676:return Rg;case 5124:case 35670:return Cg;case 35667:case 35671:return Pg;case 35668:case 35672:return kg;case 35669:case 35673:return Lg;case 5125:return Dg;case 36294:return Ig;case 36295:return Ng;case 36296:return Ug;case 35678:case 36198:case 36298:case 36306:case 35682:return Fg;case 35679:case 36299:case 36307:return zg;case 35680:case 36300:case 36308:case 36293:return Bg;case 36289:case 36303:case 36311:case 36292:return Og}}class Gg{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=Mg(e.type)}}class Vg{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Hg(e.type)}}class Wg{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const n=this.seq;for(let s=0,r=n.length;s!==r;++s){const o=n[s];o.setValue(t,e[o.id],i)}}}const Wr=/(\w+)(\])?(\[|\.)?/g;function Fl(a,t){a.seq.push(t),a.map[t.id]=t}function Xg(a,t,e){const i=a.name,n=i.length;for(Wr.lastIndex=0;;){const s=Wr.exec(i),r=Wr.lastIndex;let o=s[1];const h=s[2]==="]",l=s[3];if(h&&(o=o|0),l===void 0||l==="["&&r+2===n){Fl(e,l===void 0?new Gg(o,a,t):new Vg(o,a,t));break}else{let u=e.map[o];u===void 0&&(u=new Wg(o),Fl(e,u)),e=u}}}class Va{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const o=t.getActiveUniform(e,r),h=t.getUniformLocation(e,o.name);Xg(o,h,this)}const n=[],s=[];for(const r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?n.push(r):s.push(r);n.length>0&&(this.seq=n.concat(s))}setValue(t,e,i,n){const s=this.map[e];s!==void 0&&s.setValue(t,i,n)}setOptional(t,e,i){const n=e[i];n!==void 0&&this.setValue(t,i,n)}static upload(t,e,i,n){for(let s=0,r=e.length;s!==r;++s){const o=e[s],h=i[o.id];h.needsUpdate!==!1&&o.setValue(t,h.value,n)}}static seqWithValue(t,e){const i=[];for(let n=0,s=t.length;n!==s;++n){const r=t[n];r.id in e&&i.push(r)}return i}}function zl(a,t,e){const i=a.createShader(t);return a.shaderSource(i,e),a.compileShader(i),i}const qg=37297;let Yg=0;function $g(a,t){const e=a.split(`
`),i=[],n=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let r=n;r<s;r++){const o=r+1;i.push(`${o===t?">":" "} ${o}: ${e[r]}`)}return i.join(`
`)}const Bl=new Ht;function Zg(a){Kt._getMatrix(Bl,Kt.workingColorSpace,a);const t=`mat3( ${Bl.elements.map(e=>e.toFixed(4))} )`;switch(Kt.getTransfer(a)){case Za:return[t,"LinearTransferOETF"];case fe:return[t,"sRGBTransferOETF"];default:return Bt("WebGLProgram: Unsupported color space: ",a),[t,"LinearTransferOETF"]}}function Ol(a,t,e){const i=a.getShaderParameter(t,a.COMPILE_STATUS),s=(a.getShaderInfoLog(t)||"").trim();if(i&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+$g(a.getShaderSource(t),o)}else return s}function Kg(a,t){const e=Zg(t);return[`vec4 ${a}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const Jg={[ih]:"Linear",[nh]:"Reinhard",[sh]:"Cineon",[er]:"ACESFilmic",[rh]:"AgX",[oh]:"Neutral",[ah]:"Custom"};function Qg(a,t){const e=Jg[t];return e===void 0?(Bt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+a+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+a+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Pa=new C;function jg(){Kt.getLuminanceCoefficients(Pa);const a=Pa.x.toFixed(4),t=Pa.y.toFixed(4),e=Pa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${a}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function tv(a){return[a.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",a.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Fs).join(`
`)}function ev(a){const t=[];for(const e in a){const i=a[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function iv(a,t){const e={},i=a.getProgramParameter(t,a.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){const s=a.getActiveAttrib(t,n),r=s.name;let o=1;s.type===a.FLOAT_MAT2&&(o=2),s.type===a.FLOAT_MAT3&&(o=3),s.type===a.FLOAT_MAT4&&(o=4),e[r]={type:s.type,location:a.getAttribLocation(t,r),locationSize:o}}return e}function Fs(a){return a!==""}function Hl(a,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return a.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Gl(a,t){return a.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const nv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Qo(a){return a.replace(nv,av)}const sv=new Map;function av(a,t){let e=Wt[t];if(e===void 0){const i=sv.get(t);if(i!==void 0)e=Wt[i],Bt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Qo(e)}const rv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vl(a){return a.replace(rv,ov)}function ov(a,t,e,i){let n="";for(let s=parseInt(t);s<parseInt(e);s++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return n}function Wl(a){let t=`precision ${a.precision} float;
	precision ${a.precision} int;
	precision ${a.precision} sampler2D;
	precision ${a.precision} samplerCube;
	precision ${a.precision} sampler3D;
	precision ${a.precision} sampler2DArray;
	precision ${a.precision} sampler2DShadow;
	precision ${a.precision} samplerCubeShadow;
	precision ${a.precision} sampler2DArrayShadow;
	precision ${a.precision} isampler2D;
	precision ${a.precision} isampler3D;
	precision ${a.precision} isamplerCube;
	precision ${a.precision} isampler2DArray;
	precision ${a.precision} usampler2D;
	precision ${a.precision} usampler3D;
	precision ${a.precision} usamplerCube;
	precision ${a.precision} usampler2DArray;
	`;return a.precision==="highp"?t+=`
#define HIGH_PRECISION`:a.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:a.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const hv={[Bs]:"SHADOWMAP_TYPE_PCF",[Ns]:"SHADOWMAP_TYPE_VSM"};function lv(a){return hv[a.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const cv={[Fn]:"ENVMAP_TYPE_CUBE",[ds]:"ENVMAP_TYPE_CUBE",[ir]:"ENVMAP_TYPE_CUBE_UV"};function dv(a){return a.envMap===!1?"ENVMAP_TYPE_CUBE":cv[a.envMapMode]||"ENVMAP_TYPE_CUBE"}const uv={[ds]:"ENVMAP_MODE_REFRACTION"};function fv(a){return a.envMap===!1?"ENVMAP_MODE_REFLECTION":uv[a.envMapMode]||"ENVMAP_MODE_REFLECTION"}const pv={[Ic]:"ENVMAP_BLENDING_MULTIPLY",[mu]:"ENVMAP_BLENDING_MIX",[gu]:"ENVMAP_BLENDING_ADD"};function mv(a){return a.envMap===!1?"ENVMAP_BLENDING_NONE":pv[a.combine]||"ENVMAP_BLENDING_NONE"}function gv(a){const t=a.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function vv(a,t,e,i){const n=a.getContext(),s=e.defines;let r=e.vertexShader,o=e.fragmentShader;const h=lv(e),l=dv(e),c=fv(e),u=mv(e),d=gv(e),f=tv(e),m=ev(s),v=n.createProgram();let p,g,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Fs).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(Fs).join(`
`),g.length>0&&(g+=`
`)):(p=[Wl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+h:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Fs).join(`
`),g=[Wl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+h:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Yi?"#define TONE_MAPPING":"",e.toneMapping!==Yi?Wt.tonemapping_pars_fragment:"",e.toneMapping!==Yi?Qg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Wt.colorspace_pars_fragment,Kg("linearToOutputTexel",e.outputColorSpace),jg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Fs).join(`
`)),r=Qo(r),r=Hl(r,e),r=Gl(r,e),o=Qo(o),o=Hl(o,e),o=Gl(o,e),r=Vl(r),o=Vl(o),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",e.glslVersion===Xh?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Xh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const b=y+p+r,x=y+g+o,S=zl(n,n.VERTEX_SHADER,b),T=zl(n,n.FRAGMENT_SHADER,x);n.attachShader(v,S),n.attachShader(v,T),e.index0AttributeName!==void 0?n.bindAttribLocation(v,0,e.index0AttributeName):e.hasPositionAttribute===!0&&n.bindAttribLocation(v,0,"position"),n.linkProgram(v);function R(N){if(a.debug.checkShaderErrors){const k=n.getProgramInfoLog(v)||"",D=n.getShaderInfoLog(S)||"",I=n.getShaderInfoLog(T)||"",P=k.trim(),B=D.trim(),O=I.trim();let j=!0,q=!0;if(n.getProgramParameter(v,n.LINK_STATUS)===!1)if(j=!1,typeof a.debug.onShaderError=="function")a.debug.onShaderError(n,v,S,T);else{const tt=Ol(n,S,"vertex"),it=Ol(n,T,"fragment");re("WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(v,n.VALIDATE_STATUS)+`

Material Name: `+N.name+`
Material Type: `+N.type+`

Program Info Log: `+P+`
`+tt+`
`+it)}else P!==""?Bt("WebGLProgram: Program Info Log:",P):(B===""||O==="")&&(q=!1);q&&(N.diagnostics={runnable:j,programLog:P,vertexShader:{log:B,prefix:p},fragmentShader:{log:O,prefix:g}})}n.deleteShader(S),n.deleteShader(T),M=new Va(n,v),E=iv(n,v)}let M;this.getUniforms=function(){return M===void 0&&R(this),M};let E;this.getAttributes=function(){return E===void 0&&R(this),E};let L=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=n.getProgramParameter(v,qg)),L},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Yg++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=S,this.fragmentShader=T,this}let xv=0;class yv{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,i){const n=this._getShaderCacheForMaterial(t);return n.has(e)===!1&&(n.add(e),e.usedTimes++),n.has(i)===!1&&(n.add(i),i.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new _v(t),e.set(t,i)),i}}class _v{constructor(t){this.id=xv++,this.code=t,this.usedTimes=0}}function Mv(a){return a===zn||a===qa||a===Ya}function wv(a,t,e,i,n,s){const r=new Wc,o=new yv,h=new Set,l=[],c=new Map,u=i.logarithmicDepthBuffer;let d=i.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(M){return h.add(M),M===0?"uv":`uv${M}`}function v(M,E,L,N,k,D){const I=N.fog,P=k.geometry,B=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?N.environment:null,O=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,j=t.get(M.envMap||B,O),q=j&&j.mapping===ir?j.image.height:null,tt=f[M.type];M.precision!==null&&(d=i.getMaxPrecision(M.precision),d!==M.precision&&Bt("WebGLProgram.getParameters:",M.precision,"not supported, using",d,"instead."));const it=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,It=it!==void 0?it.length:0;let Tt=0;P.morphAttributes.position!==void 0&&(Tt=1),P.morphAttributes.normal!==void 0&&(Tt=2),P.morphAttributes.color!==void 0&&(Tt=3);let ce,Qt,oe,$;if(tt){const ye=Gi[tt];ce=ye.vertexShader,Qt=ye.fragmentShader}else{ce=M.vertexShader,Qt=M.fragmentShader;const ye=o.getVertexShaderStage(M),de=o.getFragmentShaderStage(M);o.update(M,ye,de),oe=ye.id,$=de.id}const et=a.getRenderTarget(),wt=a.state.buffers.depth.getReversed(),Ot=k.isInstancedMesh===!0,_t=k.isBatchedMesh===!0,Xt=!!M.map,Fe=!!M.matcap,qt=!!j,se=!!M.aoMap,xe=!!M.lightMap,Zt=!!M.bumpMap&&M.wireframe===!1,be=!!M.normalMap,Ge=!!M.displacementMap,ai=!!M.emissiveMap,Te=!!M.metalnessMap,Ie=!!M.roughnessMap,z=M.anisotropy>0,Ye=M.clearcoat>0,me=M.dispersion>0,A=M.retroreflectivity>0,_=M.iridescence>0,H=M.sheen>0,W=M.transmission>0,Y=z&&!!M.anisotropyMap,rt=Ye&&!!M.clearcoatMap,ot=Ye&&!!M.clearcoatNormalMap,Z=Ye&&!!M.clearcoatRoughnessMap,Q=_&&!!M.iridescenceMap,lt=_&&!!M.iridescenceThicknessMap,Rt=H&&!!M.sheenColorMap,pt=H&&!!M.sheenRoughnessMap,ct=!!M.specularMap,Ct=!!M.specularColorMap,zt=!!M.specularIntensityMap,Gt=W&&!!M.transmissionMap,F=W&&!!M.thicknessMap,dt=!!M.gradientMap,K=!!M.alphaMap,ut=M.alphaTest>0,xt=!!M.alphaHash,st=!!M.extensions;let Lt=Yi;M.toneMapped&&(et===null||et.isXRRenderTarget===!0)&&(Lt=a.toneMapping);const Et={shaderID:tt,shaderType:M.type,shaderName:M.name,vertexShader:ce,fragmentShader:Qt,defines:M.defines,customVertexShaderID:oe,customFragmentShaderID:$,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:d,batching:_t,batchingColor:_t&&k._colorsTexture!==null,instancing:Ot,instancingColor:Ot&&k.instanceColor!==null,instancingMorph:Ot&&k.morphTexture!==null,outputColorSpace:et===null?a.outputColorSpace:et.isXRRenderTarget===!0?et.texture.colorSpace:Kt.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Xt,matcap:Fe,envMap:qt,envMapMode:qt&&j.mapping,envMapCubeUVHeight:q,aoMap:se,lightMap:xe,bumpMap:Zt,normalMap:be,displacementMap:Ge,emissiveMap:ai,normalMapObjectSpace:be&&M.normalMapType===yu,normalMapTangentSpace:be&&M.normalMapType===qo,packedNormalMap:be&&M.normalMapType===qo&&Mv(M.normalMap.format),metalnessMap:Te,roughnessMap:Ie,anisotropy:z,anisotropyMap:Y,clearcoat:Ye,clearcoatMap:rt,clearcoatNormalMap:ot,clearcoatRoughnessMap:Z,dispersion:me,retroreflection:A,iridescence:_,iridescenceMap:Q,iridescenceThicknessMap:lt,sheen:H,sheenColorMap:Rt,sheenRoughnessMap:pt,specularMap:ct,specularColorMap:Ct,specularIntensityMap:zt,transmission:W,transmissionMap:Gt,thicknessMap:F,gradientMap:dt,opaque:M.transparent===!1&&M.blending===Un&&M.alphaToCoverage===!1,alphaMap:K,alphaTest:ut,alphaHash:xt,combine:M.combine,mapUv:Xt&&m(M.map.channel),aoMapUv:se&&m(M.aoMap.channel),lightMapUv:xe&&m(M.lightMap.channel),bumpMapUv:Zt&&m(M.bumpMap.channel),normalMapUv:be&&m(M.normalMap.channel),displacementMapUv:Ge&&m(M.displacementMap.channel),emissiveMapUv:ai&&m(M.emissiveMap.channel),metalnessMapUv:Te&&m(M.metalnessMap.channel),roughnessMapUv:Ie&&m(M.roughnessMap.channel),anisotropyMapUv:Y&&m(M.anisotropyMap.channel),clearcoatMapUv:rt&&m(M.clearcoatMap.channel),clearcoatNormalMapUv:ot&&m(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Z&&m(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Q&&m(M.iridescenceMap.channel),iridescenceThicknessMapUv:lt&&m(M.iridescenceThicknessMap.channel),sheenColorMapUv:Rt&&m(M.sheenColorMap.channel),sheenRoughnessMapUv:pt&&m(M.sheenRoughnessMap.channel),specularMapUv:ct&&m(M.specularMap.channel),specularColorMapUv:Ct&&m(M.specularColorMap.channel),specularIntensityMapUv:zt&&m(M.specularIntensityMap.channel),transmissionMapUv:Gt&&m(M.transmissionMap.channel),thicknessMapUv:F&&m(M.thicknessMap.channel),alphaMapUv:K&&m(M.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(be||z),vertexNormals:!!P.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!P.attributes.uv&&(Xt||K),fog:!!I,useFog:M.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||P.attributes.normal===void 0&&be===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:wt,skinning:k.isSkinnedMesh===!0,hasPositionAttribute:P.attributes.position!==void 0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:It,morphTextureStride:Tt,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:D.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:M.dithering,shadowMapEnabled:a.shadowMap.enabled&&L.length>0,shadowMapType:a.shadowMap.type,toneMapping:Lt,decodeVideoTexture:Xt&&M.map.isVideoTexture===!0&&Kt.getTransfer(M.map.colorSpace)===fe,decodeVideoTextureEmissive:ai&&M.emissiveMap.isVideoTexture===!0&&Kt.getTransfer(M.emissiveMap.colorSpace)===fe,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===we,flipSided:M.side===ei,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:st&&M.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(st&&M.extensions.multiDraw===!0||_t)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Et.vertexUv1s=h.has(1),Et.vertexUv2s=h.has(2),Et.vertexUv3s=h.has(3),h.clear(),Et}function p(M){const E=[];if(M.shaderID?E.push(M.shaderID):(E.push(M.customVertexShaderID),E.push(M.customFragmentShaderID)),M.defines!==void 0)for(const L in M.defines)E.push(L),E.push(M.defines[L]);return M.isRawShaderMaterial===!1&&(g(E,M),y(E,M),E.push(a.outputColorSpace)),E.push(M.customProgramCacheKey),E.join()}function g(M,E){M.push(E.precision),M.push(E.outputColorSpace),M.push(E.envMapMode),M.push(E.envMapCubeUVHeight),M.push(E.mapUv),M.push(E.alphaMapUv),M.push(E.lightMapUv),M.push(E.aoMapUv),M.push(E.bumpMapUv),M.push(E.normalMapUv),M.push(E.displacementMapUv),M.push(E.emissiveMapUv),M.push(E.metalnessMapUv),M.push(E.roughnessMapUv),M.push(E.anisotropyMapUv),M.push(E.clearcoatMapUv),M.push(E.clearcoatNormalMapUv),M.push(E.clearcoatRoughnessMapUv),M.push(E.iridescenceMapUv),M.push(E.iridescenceThicknessMapUv),M.push(E.sheenColorMapUv),M.push(E.sheenRoughnessMapUv),M.push(E.specularMapUv),M.push(E.specularColorMapUv),M.push(E.specularIntensityMapUv),M.push(E.transmissionMapUv),M.push(E.thicknessMapUv),M.push(E.combine),M.push(E.fogExp2),M.push(E.sizeAttenuation),M.push(E.morphTargetsCount),M.push(E.morphAttributeCount),M.push(E.numSunLights),M.push(E.numDirLights),M.push(E.numPointLights),M.push(E.numSpotLights),M.push(E.numSpotLightMaps),M.push(E.numHemiLights),M.push(E.numRectAreaLights),M.push(E.numSunLightShadows),M.push(E.numDirLightShadows),M.push(E.numPointLightShadows),M.push(E.numSpotLightShadows),M.push(E.numSpotLightShadowsWithMaps),M.push(E.numLightProbes),M.push(E.shadowMapType),M.push(E.toneMapping),M.push(E.numClippingPlanes),M.push(E.numClipIntersection),M.push(E.depthPacking)}function y(M,E){r.disableAll(),E.instancing&&r.enable(0),E.instancingColor&&r.enable(1),E.instancingMorph&&r.enable(2),E.matcap&&r.enable(3),E.envMap&&r.enable(4),E.normalMapObjectSpace&&r.enable(5),E.normalMapTangentSpace&&r.enable(6),E.clearcoat&&r.enable(7),E.iridescence&&r.enable(8),E.alphaTest&&r.enable(9),E.vertexColors&&r.enable(10),E.vertexAlphas&&r.enable(11),E.vertexUv1s&&r.enable(12),E.vertexUv2s&&r.enable(13),E.vertexUv3s&&r.enable(14),E.vertexTangents&&r.enable(15),E.anisotropy&&r.enable(16),E.alphaHash&&r.enable(17),E.batching&&r.enable(18),E.dispersion&&r.enable(19),E.retroreflection&&r.enable(24),E.batchingColor&&r.enable(20),E.gradientMap&&r.enable(21),E.packedNormalMap&&r.enable(22),E.vertexNormals&&r.enable(23),M.push(r.mask),r.disableAll(),E.fog&&r.enable(0),E.useFog&&r.enable(1),E.flatShading&&r.enable(2),E.logarithmicDepthBuffer&&r.enable(3),E.reversedDepthBuffer&&r.enable(4),E.skinning&&r.enable(5),E.morphTargets&&r.enable(6),E.morphNormals&&r.enable(7),E.morphColors&&r.enable(8),E.premultipliedAlpha&&r.enable(9),E.shadowMapEnabled&&r.enable(10),E.doubleSided&&r.enable(11),E.flipSided&&r.enable(12),E.useDepthPacking&&r.enable(13),E.dithering&&r.enable(14),E.transmission&&r.enable(15),E.sheen&&r.enable(16),E.opaque&&r.enable(17),E.pointsUvs&&r.enable(18),E.decodeVideoTexture&&r.enable(19),E.decodeVideoTextureEmissive&&r.enable(20),E.alphaToCoverage&&r.enable(21),E.numLightProbeGrids>0&&r.enable(22),E.hasPositionAttribute&&r.enable(23),M.push(r.mask)}function b(M){const E=f[M.type];let L;if(E){const N=Gi[E];L=ps.clone(N.uniforms)}else L=M.uniforms;return L}function x(M,E){let L=c.get(E);return L!==void 0?++L.usedTimes:(L=new vv(a,E,M,n),l.push(L),c.set(E,L)),L}function S(M){if(--M.usedTimes===0){const E=l.indexOf(M);l[E]=l[l.length-1],l.pop(),c.delete(M.cacheKey),M.destroy()}}function T(M){o.remove(M)}function R(){o.dispose()}return{getParameters:v,getProgramCacheKey:p,getUniforms:b,acquireProgram:x,releaseProgram:S,releaseShaderCache:T,programs:l,dispose:R}}function bv(){let a=new WeakMap;function t(r){return a.has(r)}function e(r){let o=a.get(r);return o===void 0&&(o={},a.set(r,o)),o}function i(r){a.delete(r)}function n(r,o,h){a.get(r)[o]=h}function s(){a=new WeakMap}return{has:t,get:e,remove:i,update:n,dispose:s}}function Sv(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.material.id!==t.material.id?a.material.id-t.material.id:a.materialVariant!==t.materialVariant?a.materialVariant-t.materialVariant:a.z!==t.z?a.z-t.z:a.id-t.id}function Xl(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.z!==t.z?t.z-a.z:a.id-t.id}function ql(){const a=[];let t=0;const e=[],i=[],n=[];function s(){t=0,e.length=0,i.length=0,n.length=0}function r(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,m,v,p,g){let y=a[t];return y===void 0?(y={id:d.id,object:d,geometry:f,material:m,materialVariant:r(d),groupOrder:v,renderOrder:d.renderOrder,z:p,group:g},a[t]=y):(y.id=d.id,y.object=d,y.geometry=f,y.material=m,y.materialVariant=r(d),y.groupOrder=v,y.renderOrder=d.renderOrder,y.z=p,y.group=g),t++,y}function h(d,f,m,v,p,g,y){y.reversedDepth===!0&&(p=-p);const b=o(d,f,m,v,p,g);m.transmission>0?i.push(b):m.transparent===!0?n.push(b):e.push(b)}function l(d,f,m,v,p,g){const y=o(d,f,m,v,p,g);m.transmission>0?i.unshift(y):m.transparent===!0?n.unshift(y):e.unshift(y)}function c(d,f){e.length>1&&e.sort(d||Sv),i.length>1&&i.sort(f||Xl),n.length>1&&n.sort(f||Xl)}function u(){for(let d=t,f=a.length;d<f;d++){const m=a[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:i,transparent:n,init:s,push:h,unshift:l,finish:u,sort:c}}function Tv(){let a=new WeakMap;function t(i,n){const s=a.get(i);let r;return s===void 0?(r=new ql,a.set(i,[r])):n>=s.length?(r=new ql,s.push(r)):r=s[n],r}function e(){a=new WeakMap}return{get:t,dispose:e}}function Ev(){const a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new C,color:new Nt};break;case"SpotLight":e={position:new C,direction:new C,color:new Nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new C,color:new Nt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new C,skyColor:new Nt,groundColor:new Nt};break;case"RectAreaLight":e={color:new Nt,position:new C,halfWidth:new C,halfHeight:new C};break}return a[t.id]=e,e}}}function Av(){const a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht,shadowCameraNear:1,shadowCameraFar:1e3};break}return a[t.id]=e,e}}}let Rv=0;function Cv(a,t){return(t.castShadow?2:0)-(a.castShadow?2:0)+(t.map?1:0)-(a.map?1:0)}function Pv(a){const t=new Ev,e=Av(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new C);const n=new C,s=new pe,r=new pe;function o(l){let c=0,u=0,d=0;for(let k=0;k<9;k++)i.probe[k].set(0,0,0);let f=0,m=0,v=0,p=0,g=0,y=0,b=0,x=0,S=0,T=0,R=0,M=0,E=0,L=0;l.sort(Cv);for(let k=0,D=l.length;k<D;k++){const I=l[k],P=I.color,B=I.intensity,O=I.distance;let j=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===zn?j=I.shadow.map.texture:j=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)c+=P.r*B,u+=P.g*B,d+=P.b*B;else if(I.isLightProbe){for(let q=0;q<9;q++)i.probe[q].addScaledVector(I.sh.coefficients[q],B);L++}else if(I.isSunLight){const q=t.get(I);if(q.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const tt=I.shadow,it=e.get(I);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize.copy(tt.mapSize).multiply(tt.getFrameExtents()),i.sunShadow[m]=it,i.sunShadowMap[m]=j;const It=tt.getViewportCount();for(let Tt=0;Tt<It;Tt++)i.sunShadowMatrix[v+Tt]=tt.getMatrix(Tt),i.sunShadowCascade[v+Tt]=tt._cascadeData[Tt];v+=It,m++}i.sun[f]=q,f++}else if(I.isDirectionalLight){const q=t.get(I);if(q.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const tt=I.shadow,it=e.get(I);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,i.directionalShadow[p]=it,i.directionalShadowMap[p]=j,i.directionalShadowMatrix[p]=I.shadow.matrix,S++}i.directional[p]=q,p++}else if(I.isSpotLight){const q=t.get(I);q.position.setFromMatrixPosition(I.matrixWorld),q.color.copy(P).multiplyScalar(B),q.distance=O,q.coneCos=Math.cos(I.angle),q.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),q.decay=I.decay,i.spot[y]=q;const tt=I.shadow;if(I.map&&(i.spotLightMap[M]=I.map,M++,tt.updateMatrices(I),I.castShadow&&E++),i.spotLightMatrix[y]=tt.matrix,I.castShadow){const it=e.get(I);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,i.spotShadow[y]=it,i.spotShadowMap[y]=j,R++}y++}else if(I.isRectAreaLight){const q=t.get(I);q.color.copy(P).multiplyScalar(B),q.halfWidth.set(I.width*.5,0,0),q.halfHeight.set(0,I.height*.5,0),i.rectArea[b]=q,b++}else if(I.isPointLight){const q=t.get(I);if(q.color.copy(I.color).multiplyScalar(I.intensity),q.distance=I.distance,q.decay=I.decay,I.castShadow){const tt=I.shadow,it=e.get(I);it.shadowIntensity=tt.intensity,it.shadowBias=tt.bias,it.shadowNormalBias=tt.normalBias,it.shadowRadius=tt.radius,it.shadowMapSize=tt.mapSize,it.shadowCameraNear=tt.camera.near,it.shadowCameraFar=tt.camera.far,i.pointShadow[g]=it,i.pointShadowMap[g]=j,i.pointShadowMatrix[g]=I.shadow.matrix,T++}i.point[g]=q,g++}else if(I.isHemisphereLight){const q=t.get(I);q.skyColor.copy(I.color).multiplyScalar(B),q.groundColor.copy(I.groundColor).multiplyScalar(B),i.hemi[x]=q,x++}}b>0&&(a.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ft.LTC_FLOAT_1,i.rectAreaLTC2=ft.LTC_FLOAT_2):(i.rectAreaLTC1=ft.LTC_HALF_1,i.rectAreaLTC2=ft.LTC_HALF_2)),i.ambient[0]=c,i.ambient[1]=u,i.ambient[2]=d;const N=i.hash;(N.sunLength!==f||N.directionalLength!==p||N.pointLength!==g||N.spotLength!==y||N.rectAreaLength!==b||N.hemiLength!==x||N.numSunShadows!==m||N.numDirectionalShadows!==S||N.numPointShadows!==T||N.numSpotShadows!==R||N.numSpotMaps!==M||N.numLightProbes!==L)&&(i.sun.length=f,i.directional.length=p,i.spot.length=y,i.rectArea.length=b,i.point.length=g,i.hemi.length=x,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=v,i.sunShadowCascade.length=v,i.directionalShadow.length=S,i.directionalShadowMap.length=S,i.directionalShadowMatrix.length=S,i.pointShadow.length=T,i.pointShadowMap.length=T,i.pointShadowMatrix.length=T,i.spotShadow.length=R,i.spotShadowMap.length=R,i.spotLightMatrix.length=R+M-E,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=L,N.sunLength=f,N.directionalLength=p,N.pointLength=g,N.spotLength=y,N.rectAreaLength=b,N.hemiLength=x,N.numSunShadows=m,N.numDirectionalShadows=S,N.numPointShadows=T,N.numSpotShadows=R,N.numSpotMaps=M,N.numLightProbes=L,i.version=Rv++)}function h(l,c){let u=0,d=0,f=0,m=0,v=0,p=0;const g=c.matrixWorldInverse;for(let y=0,b=l.length;y<b;y++){const x=l[y];if(x.isSunLight){const S=i.sun[u];S.direction.setFromMatrixPosition(x.matrixWorld),S.direction.transformDirection(g),u++}else if(x.isDirectionalLight){const S=i.directional[d];S.direction.setFromMatrixPosition(x.matrixWorld),n.setFromMatrixPosition(x.target.matrixWorld),S.direction.sub(n),S.direction.transformDirection(g),d++}else if(x.isSpotLight){const S=i.spot[m];S.position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),S.direction.setFromMatrixPosition(x.matrixWorld),n.setFromMatrixPosition(x.target.matrixWorld),S.direction.sub(n),S.direction.transformDirection(g),m++}else if(x.isRectAreaLight){const S=i.rectArea[v];S.position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),r.identity(),s.copy(x.matrixWorld),s.premultiply(g),r.extractRotation(s),S.halfWidth.set(x.width*.5,0,0),S.halfHeight.set(0,x.height*.5,0),S.halfWidth.applyMatrix4(r),S.halfHeight.applyMatrix4(r),v++}else if(x.isPointLight){const S=i.point[f];S.position.setFromMatrixPosition(x.matrixWorld),S.position.applyMatrix4(g),f++}else if(x.isHemisphereLight){const S=i.hemi[p];S.direction.setFromMatrixPosition(x.matrixWorld),S.direction.transformDirection(g),p++}}}return{setup:o,setupView:h,state:i}}function Yl(a){const t=new Pv(a),e=[],i=[],n=[];function s(d){u.camera=d,e.length=0,i.length=0,n.length=0}function r(d){e.push(d)}function o(d){i.push(d)}function h(d){n.push(d)}function l(){t.setup(e)}function c(d){t.setupView(e,d)}const u={lightsArray:e,shadowsArray:i,lightProbeGridArray:n,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:u,setupLights:l,setupLightsView:c,pushLight:r,pushShadow:o,pushLightProbeGrid:h}}function kv(a){let t=new WeakMap;function e(n,s=0){const r=t.get(n);let o;return r===void 0?(o=new Yl(a),t.set(n,[o])):s>=r.length?(o=new Yl(a),r.push(o)):o=r[s],o}function i(){t=new WeakMap}return{get:e,dispose:i}}const Lv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Dv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Iv=[new C(1,0,0),new C(-1,0,0),new C(0,1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1)],Nv=[new C(0,-1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1),new C(0,-1,0),new C(0,-1,0)],$l=new pe,ks=new C,Xr=new C;function Uv(a,t,e){let i=new yh;const n=new ht,s=new ht,r=new Re,o=new Hf,h=new Gf,l={},c=e.maxTextureSize,u={[Sn]:ei,[ei]:Sn,[we]:we},d=new Be({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ht},radius:{value:4}},vertexShader:Lv,fragmentShader:Dv}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const m=new Se;m.setAttribute("position",new qe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new J(m,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Bs;let g=this.type;this.render=function(T,R,M){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||T.length===0)return;this.type===Kd&&(Bt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Bs);const E=a.getRenderTarget(),L=a.getActiveCubeFace(),N=a.getActiveMipmapLevel(),k=a.state;k.setBlending(qi),k.buffers.depth.getReversed()===!0?k.buffers.color.setClear(0,0,0,0):k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const D=g!==this.type;D&&R.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(P=>P.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,P=T.length;I<P;I++){const B=T[I],O=B.shadow;if(O===void 0){Bt("WebGLShadowMap:",B,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;n.copy(O.mapSize);const j=O.getFrameExtents();n.multiply(j),s.copy(O.mapSize),(n.x>c||n.y>c)&&(n.x>c&&(s.x=Math.floor(c/j.x),n.x=s.x*j.x,O.mapSize.x=s.x),n.y>c&&(s.y=Math.floor(c/j.y),n.y=s.y*j.y,O.mapSize.y=s.y));const q=a.state.buffers.depth.getReversed();if(O.camera._reversedDepth=q,O.map===null||D===!0){if(O.map!==null&&(O.map.depthTexture!==null&&(O.map.depthTexture.dispose(),O.map.depthTexture=null),O.map.dispose()),this.type===Ns){if(B.isPointLight){Bt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}O.map=new ni(n.x,n.y,{format:zn,type:ci,minFilter:Qe,magFilter:Qe,generateMipmaps:!1}),O.map.texture.name=B.name+".shadowMap",O.map.depthTexture=new $s(n.x,n.y,Di),O.map.depthTexture.name=B.name+".shadowMapDepth",O.map.depthTexture.format=hn,O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Xe,O.map.depthTexture.magFilter=Xe}else B.isPointLight?(O.map=new pd(n.x),O.map.depthTexture=new rf(n.x,Zi)):(O.map=new ni(n.x,n.y),O.map.depthTexture=new $s(n.x,n.y,Zi)),O.map.depthTexture.name=B.name+".shadowMap",O.map.depthTexture.format=hn,this.type===Bs?(O.map.depthTexture.compareFunction=q?gh:mh,O.map.depthTexture.minFilter=Qe,O.map.depthTexture.magFilter=Qe):(O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=Xe,O.map.depthTexture.magFilter=Xe);O.camera.updateProjectionMatrix()}O.map.isWebGLCubeRenderTarget!==!0&&(O.map.width!==n.x||O.map.height!==n.y)&&O.map.setSize(n.x,n.y);const tt=O.map.isWebGLCubeRenderTarget?6:O.getViewportCount();B.isPointLight!==!0&&O.updateMatrices(B,M);for(let it=0;it<tt;it++){const It=O.getCamera(it);if(B.isPointLight){const Tt=O.camera,ce=O.matrix,Qt=B.distance||Tt.far;Qt!==Tt.far&&(Tt.far=Qt,Tt.updateProjectionMatrix()),ks.setFromMatrixPosition(B.matrixWorld),Tt.position.copy(ks),Xr.copy(Tt.position),Xr.add(Iv[it]),Tt.up.copy(Nv[it]),Tt.lookAt(Xr),Tt.updateMatrixWorld(),ce.makeTranslation(-ks.x,-ks.y,-ks.z),$l.multiplyMatrices(Tt.projectionMatrix,Tt.matrixWorldInverse),O._frustum.setFromProjectionMatrix($l,Tt.coordinateSystem,Tt.reversedDepth)}if(O.map.isWebGLCubeRenderTarget)a.setRenderTarget(O.map,it),a.clear();else{it===0&&(a.setRenderTarget(O.map),a.clear());const Tt=O.getViewport(it);r.set(s.x*Tt.x,s.y*Tt.y,s.x*Tt.z,s.y*Tt.w),k.viewport(r)}i=O.getFrustum(it),x(R,M,It,B,this.type)}O.isPointLightShadow!==!0&&this.type===Ns&&y(O,M),O.needsUpdate=!1}g=this.type,p.needsUpdate=!1,a.setRenderTarget(E,L,N)};function y(T,R){const M=t.update(v);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,f.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),T.mapPass===null?T.mapPass=new ni(n.x,n.y,{format:zn,type:ci}):(T.mapPass.width!==T.map.width||T.mapPass.height!==T.map.height)&&T.mapPass.setSize(T.map.width,T.map.height),d.uniforms.shadow_pass.value=T.map.depthTexture,d.uniforms.resolution.value.set(T.map.width,T.map.height),d.uniforms.radius.value=T.radius,a.setRenderTarget(T.mapPass),a.clear(),a.renderBufferDirect(R,null,M,d,v,null),f.uniforms.shadow_pass.value=T.mapPass.texture,f.uniforms.resolution.value.set(T.map.width,T.map.height),f.uniforms.radius.value=T.radius,a.setRenderTarget(T.map),a.clear(),a.renderBufferDirect(R,null,M,f,v,null)}function b(T,R,M,E){let L=null;const N=M.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(N!==void 0)L=N;else if(L=M.isPointLight===!0?h:o,a.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const k=L.uuid,D=R.uuid;let I=l[k];I===void 0&&(I={},l[k]=I);let P=I[D];P===void 0&&(P=L.clone(),I[D]=P,R.addEventListener("dispose",S)),L=P}if(L.visible=R.visible,L.wireframe=R.wireframe,E===Ns?L.side=R.shadowSide!==null?R.shadowSide:R.side:L.side=R.shadowSide!==null?R.shadowSide:u[R.side],L.alphaMap=R.alphaMap,L.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,L.map=R.map,L.clipShadows=R.clipShadows,L.clippingPlanes=R.clippingPlanes,L.clipIntersection=R.clipIntersection,L.displacementMap=R.displacementMap,L.displacementScale=R.displacementScale,L.displacementBias=R.displacementBias,L.wireframeLinewidth=R.wireframeLinewidth,L.linewidth=R.linewidth,M.isPointLight===!0&&L.isMeshDistanceMaterial===!0){const k=a.properties.get(L);k.light=M}return L}function x(T,R,M,E,L){if(T.visible===!1)return;if(T.layers.test(R.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&L===Ns)&&(!T.frustumCulled||T.intersectsFrustum(i))){T.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,T.matrixWorld);const D=t.update(T),I=T.material;if(Array.isArray(I)){const P=D.groups;for(let B=0,O=P.length;B<O;B++){const j=P[B],q=I[j.materialIndex];if(q&&q.visible){const tt=b(T,q,E,L);T.onBeforeShadow(a,T,R,M,D,tt,j),a.renderBufferDirect(M,null,D,tt,T,j),T.onAfterShadow(a,T,R,M,D,tt,j)}}}else if(I.visible){const P=b(T,I,E,L);T.onBeforeShadow(a,T,R,M,D,P,null),a.renderBufferDirect(M,null,D,P,T,null),T.onAfterShadow(a,T,R,M,D,P,null)}}const k=T.children;for(let D=0,I=k.length;D<I;D++)x(k[D],R,M,E,L)}function S(T){T.target.removeEventListener("dispose",S);for(const M in l){const E=l[M],L=T.target.uuid;L in E&&(E[L].dispose(),delete E[L])}}}function Fv(a,t){function e(){let F=!1;const dt=new Re;let K=null;const ut=new Re(0,0,0,0);return{setMask:function(xt){K!==xt&&!F&&(a.colorMask(xt,xt,xt,xt),K=xt)},setLocked:function(xt){F=xt},setClear:function(xt,st,Lt,Et,ye){ye===!0&&(xt*=Et,st*=Et,Lt*=Et),dt.set(xt,st,Lt,Et),ut.equals(dt)===!1&&(a.clearColor(xt,st,Lt,Et),ut.copy(dt))},reset:function(){F=!1,K=null,ut.set(-1,0,0,0)}}}function i(){let F=!1,dt=!1,K=null,ut=null,xt=null;return{setReversed:function(st){if(dt!==st){const Lt=t.get("EXT_clip_control");st?Lt.clipControlEXT(Lt.LOWER_LEFT_EXT,Lt.ZERO_TO_ONE_EXT):Lt.clipControlEXT(Lt.LOWER_LEFT_EXT,Lt.NEGATIVE_ONE_TO_ONE_EXT),dt=st;const Et=xt;xt=null,this.setClear(Et)}},getReversed:function(){return dt},setTest:function(st){st?et(a.DEPTH_TEST):wt(a.DEPTH_TEST)},setMask:function(st){K!==st&&!F&&(a.depthMask(st),K=st)},setFunc:function(st){if(dt&&(st=ku[st]),ut!==st){switch(st){case ro:a.depthFunc(a.NEVER);break;case oo:a.depthFunc(a.ALWAYS);break;case ho:a.depthFunc(a.LESS);break;case Ws:a.depthFunc(a.LEQUAL);break;case lo:a.depthFunc(a.EQUAL);break;case co:a.depthFunc(a.GEQUAL);break;case uo:a.depthFunc(a.GREATER);break;case fo:a.depthFunc(a.NOTEQUAL);break;default:a.depthFunc(a.LEQUAL)}ut=st}},setLocked:function(st){F=st},setClear:function(st){xt!==st&&(xt=st,dt&&(st=1-st),a.clearDepth(st))},reset:function(){F=!1,K=null,ut=null,xt=null,dt=!1}}}function n(){let F=!1,dt=null,K=null,ut=null,xt=null,st=null,Lt=null,Et=null,ye=null;return{setTest:function(de){F||(de?et(a.STENCIL_TEST):wt(a.STENCIL_TEST))},setMask:function(de){dt!==de&&!F&&(a.stencilMask(de),dt=de)},setFunc:function(de,Ti,Ni){(K!==de||ut!==Ti||xt!==Ni)&&(a.stencilFunc(de,Ti,Ni),K=de,ut=Ti,xt=Ni)},setOp:function(de,Ti,Ni){(st!==de||Lt!==Ti||Et!==Ni)&&(a.stencilOp(de,Ti,Ni),st=de,Lt=Ti,Et=Ni)},setLocked:function(de){F=de},setClear:function(de){ye!==de&&(a.clearStencil(de),ye=de)},reset:function(){F=!1,dt=null,K=null,ut=null,xt=null,st=null,Lt=null,Et=null,ye=null}}}const s=new e,r=new i,o=new n,h=new WeakMap,l=new WeakMap;let c={},u={},d={},f=new WeakMap,m=[],v=null,p=!1,g=null,y=null,b=null,x=null,S=null,T=null,R=null,M=new Nt(0,0,0),E=0,L=!1,N=null,k=null,D=null,I=null,P=null;const B=a.getParameter(a.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let O=!1,j=0;const q=a.getParameter(a.VERSION);q.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(q)[1]),O=j>=1):q.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),O=j>=2);let tt=null,it={};const It=a.getParameter(a.SCISSOR_BOX),Tt=a.getParameter(a.VIEWPORT),ce=new Re().fromArray(It),Qt=new Re().fromArray(Tt);function oe(F,dt,K,ut){const xt=new Uint8Array(4),st=a.createTexture();a.bindTexture(F,st),a.texParameteri(F,a.TEXTURE_MIN_FILTER,a.NEAREST),a.texParameteri(F,a.TEXTURE_MAG_FILTER,a.NEAREST);for(let Lt=0;Lt<K;Lt++)F===a.TEXTURE_3D||F===a.TEXTURE_2D_ARRAY?a.texImage3D(dt,0,a.RGBA,1,1,ut,0,a.RGBA,a.UNSIGNED_BYTE,xt):a.texImage2D(dt+Lt,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,xt);return st}const $={};$[a.TEXTURE_2D]=oe(a.TEXTURE_2D,a.TEXTURE_2D,1),$[a.TEXTURE_CUBE_MAP]=oe(a.TEXTURE_CUBE_MAP,a.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[a.TEXTURE_2D_ARRAY]=oe(a.TEXTURE_2D_ARRAY,a.TEXTURE_2D_ARRAY,1,1),$[a.TEXTURE_3D]=oe(a.TEXTURE_3D,a.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),o.setClear(0),et(a.DEPTH_TEST),r.setFunc(Ws),Zt(!1),be(Gh),et(a.CULL_FACE),se(qi);function et(F){c[F]!==!0&&(a.enable(F),c[F]=!0)}function wt(F){c[F]!==!1&&(a.disable(F),c[F]=!1)}function Ot(F,dt){return d[F]!==dt?(a.bindFramebuffer(F,dt),d[F]=dt,F===a.DRAW_FRAMEBUFFER&&(d[a.FRAMEBUFFER]=dt),F===a.FRAMEBUFFER&&(d[a.DRAW_FRAMEBUFFER]=dt),!0):!1}function _t(F,dt){let K=m,ut=!1;if(F){K=f.get(dt),K===void 0&&(K=[],f.set(dt,K));const xt=F.textures;if(K.length!==xt.length||K[0]!==a.COLOR_ATTACHMENT0){for(let st=0,Lt=xt.length;st<Lt;st++)K[st]=a.COLOR_ATTACHMENT0+st;K.length=xt.length,ut=!0}}else K[0]!==a.BACK&&(K[0]=a.BACK,ut=!0);ut&&a.drawBuffers(K)}function Xt(F){return v!==F?(a.useProgram(F),v=F,!0):!1}const Fe={[os]:a.FUNC_ADD,[Qd]:a.FUNC_SUBTRACT,[jd]:a.FUNC_REVERSE_SUBTRACT};Fe[tu]=a.MIN,Fe[eu]=a.MAX;const qt={[iu]:a.ZERO,[nu]:a.ONE,[su]:a.SRC_COLOR,[Lc]:a.SRC_ALPHA,[cu]:a.SRC_ALPHA_SATURATE,[hu]:a.DST_COLOR,[ru]:a.DST_ALPHA,[au]:a.ONE_MINUS_SRC_COLOR,[Dc]:a.ONE_MINUS_SRC_ALPHA,[lu]:a.ONE_MINUS_DST_COLOR,[ou]:a.ONE_MINUS_DST_ALPHA,[du]:a.CONSTANT_COLOR,[uu]:a.ONE_MINUS_CONSTANT_COLOR,[fu]:a.CONSTANT_ALPHA,[pu]:a.ONE_MINUS_CONSTANT_ALPHA};function se(F,dt,K,ut,xt,st,Lt,Et,ye,de){if(F===qi){p===!0&&(wt(a.BLEND),p=!1);return}if(p===!1&&(et(a.BLEND),p=!0),F!==Jd){if(F!==g||de!==L){if((y!==os||S!==os)&&(a.blendEquation(a.FUNC_ADD),y=os,S=os),de)switch(F){case Un:a.blendFuncSeparate(a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case xi:a.blendFunc(a.ONE,a.ONE);break;case Vh:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case Wh:a.blendFuncSeparate(a.DST_COLOR,a.ONE_MINUS_SRC_ALPHA,a.ZERO,a.ONE);break;default:re("WebGLState: Invalid blending: ",F);break}else switch(F){case Un:a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case xi:a.blendFuncSeparate(a.SRC_ALPHA,a.ONE,a.ONE,a.ONE);break;case Vh:re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Wh:re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:re("WebGLState: Invalid blending: ",F);break}b=null,x=null,T=null,R=null,M.set(0,0,0),E=0,g=F,L=de}return}xt=xt||dt,st=st||K,Lt=Lt||ut,(dt!==y||xt!==S)&&(a.blendEquationSeparate(Fe[dt],Fe[xt]),y=dt,S=xt),(K!==b||ut!==x||st!==T||Lt!==R)&&(a.blendFuncSeparate(qt[K],qt[ut],qt[st],qt[Lt]),b=K,x=ut,T=st,R=Lt),(Et.equals(M)===!1||ye!==E)&&(a.blendColor(Et.r,Et.g,Et.b,ye),M.copy(Et),E=ye),g=F,L=!1}function xe(F,dt){F.side===we?wt(a.CULL_FACE):et(a.CULL_FACE);let K=F.side===ei;dt&&(K=!K),Zt(K),F.blending===Un&&F.transparent===!1?se(qi):se(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),r.setFunc(F.depthFunc),r.setTest(F.depthTest),r.setMask(F.depthWrite),s.setMask(F.colorWrite);const ut=F.stencilWrite;o.setTest(ut),ut&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),ai(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?et(a.SAMPLE_ALPHA_TO_COVERAGE):wt(a.SAMPLE_ALPHA_TO_COVERAGE)}function Zt(F){N!==F&&(F?a.frontFace(a.CW):a.frontFace(a.CCW),N=F)}function be(F){F!==$d?(et(a.CULL_FACE),F!==k&&(F===Gh?a.cullFace(a.BACK):F===Zd?a.cullFace(a.FRONT):a.cullFace(a.FRONT_AND_BACK))):wt(a.CULL_FACE),k=F}function Ge(F){F!==D&&(O&&a.lineWidth(F),D=F)}function ai(F,dt,K){F?(et(a.POLYGON_OFFSET_FILL),(I!==dt||P!==K)&&(I=dt,P=K,r.getReversed()&&(dt=-dt),a.polygonOffset(dt,K))):wt(a.POLYGON_OFFSET_FILL)}function Te(F){F?et(a.SCISSOR_TEST):wt(a.SCISSOR_TEST)}function Ie(F){F===void 0&&(F=a.TEXTURE0+B-1),tt!==F&&(a.activeTexture(F),tt=F)}function z(F,dt,K){K===void 0&&(tt===null?K=a.TEXTURE0+B-1:K=tt);let ut=it[K];ut===void 0&&(ut={type:void 0,texture:void 0},it[K]=ut),(ut.type!==F||ut.texture!==dt)&&(tt!==K&&(a.activeTexture(K),tt=K),a.bindTexture(F,dt||$[F]),ut.type=F,ut.texture=dt)}function Ye(){const F=it[tt];F!==void 0&&F.type!==void 0&&(a.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function me(){try{a.compressedTexImage2D(...arguments)}catch(F){re("WebGLState:",F)}}function A(){try{a.compressedTexImage3D(...arguments)}catch(F){re("WebGLState:",F)}}function _(){try{a.texSubImage2D(...arguments)}catch(F){re("WebGLState:",F)}}function H(){try{a.texSubImage3D(...arguments)}catch(F){re("WebGLState:",F)}}function W(){try{a.compressedTexSubImage2D(...arguments)}catch(F){re("WebGLState:",F)}}function Y(){try{a.compressedTexSubImage3D(...arguments)}catch(F){re("WebGLState:",F)}}function rt(){try{a.texStorage2D(...arguments)}catch(F){re("WebGLState:",F)}}function ot(){try{a.texStorage3D(...arguments)}catch(F){re("WebGLState:",F)}}function Z(){try{a.texImage2D(...arguments)}catch(F){re("WebGLState:",F)}}function Q(){try{a.texImage3D(...arguments)}catch(F){re("WebGLState:",F)}}function lt(F){return u[F]!==void 0?u[F]:a.getParameter(F)}function Rt(F,dt){u[F]!==dt&&(a.pixelStorei(F,dt),u[F]=dt)}function pt(F){ce.equals(F)===!1&&(a.scissor(F.x,F.y,F.z,F.w),ce.copy(F))}function ct(F){Qt.equals(F)===!1&&(a.viewport(F.x,F.y,F.z,F.w),Qt.copy(F))}function Ct(F,dt){let K=l.get(dt);K===void 0&&(K=new WeakMap,l.set(dt,K));let ut=K.get(F);ut===void 0&&(ut=a.getUniformBlockIndex(dt,F.name),K.set(F,ut))}function zt(F,dt){const ut=l.get(dt).get(F);h.get(dt)!==ut&&(a.uniformBlockBinding(dt,ut,F.__bindingPointIndex),h.set(dt,ut))}function Gt(){a.disable(a.BLEND),a.disable(a.CULL_FACE),a.disable(a.DEPTH_TEST),a.disable(a.POLYGON_OFFSET_FILL),a.disable(a.SCISSOR_TEST),a.disable(a.STENCIL_TEST),a.disable(a.SAMPLE_ALPHA_TO_COVERAGE),a.blendEquation(a.FUNC_ADD),a.blendFunc(a.ONE,a.ZERO),a.blendFuncSeparate(a.ONE,a.ZERO,a.ONE,a.ZERO),a.blendColor(0,0,0,0),a.colorMask(!0,!0,!0,!0),a.clearColor(0,0,0,0),a.depthMask(!0),a.depthFunc(a.LESS),r.setReversed(!1),a.clearDepth(1),a.stencilMask(4294967295),a.stencilFunc(a.ALWAYS,0,4294967295),a.stencilOp(a.KEEP,a.KEEP,a.KEEP),a.clearStencil(0),a.cullFace(a.BACK),a.frontFace(a.CCW),a.polygonOffset(0,0),a.activeTexture(a.TEXTURE0),a.bindFramebuffer(a.FRAMEBUFFER,null),a.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),a.bindFramebuffer(a.READ_FRAMEBUFFER,null),a.useProgram(null),a.lineWidth(1),a.scissor(0,0,a.canvas.width,a.canvas.height),a.viewport(0,0,a.canvas.width,a.canvas.height),a.pixelStorei(a.PACK_ALIGNMENT,4),a.pixelStorei(a.UNPACK_ALIGNMENT,4),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!1),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,a.BROWSER_DEFAULT_WEBGL),a.pixelStorei(a.PACK_ROW_LENGTH,0),a.pixelStorei(a.PACK_SKIP_PIXELS,0),a.pixelStorei(a.PACK_SKIP_ROWS,0),a.pixelStorei(a.UNPACK_ROW_LENGTH,0),a.pixelStorei(a.UNPACK_IMAGE_HEIGHT,0),a.pixelStorei(a.UNPACK_SKIP_PIXELS,0),a.pixelStorei(a.UNPACK_SKIP_ROWS,0),a.pixelStorei(a.UNPACK_SKIP_IMAGES,0),c={},u={},tt=null,it={},d={},f=new WeakMap,m=[],v=null,p=!1,g=null,y=null,b=null,x=null,S=null,T=null,R=null,M=new Nt(0,0,0),E=0,L=!1,N=null,k=null,D=null,I=null,P=null,ce.set(0,0,a.canvas.width,a.canvas.height),Qt.set(0,0,a.canvas.width,a.canvas.height),s.reset(),r.reset(),o.reset()}return{buffers:{color:s,depth:r,stencil:o},enable:et,disable:wt,bindFramebuffer:Ot,drawBuffers:_t,useProgram:Xt,setBlending:se,setMaterial:xe,setFlipSided:Zt,setCullFace:be,setLineWidth:Ge,setPolygonOffset:ai,setScissorTest:Te,activeTexture:Ie,bindTexture:z,unbindTexture:Ye,compressedTexImage2D:me,compressedTexImage3D:A,texImage2D:Z,texImage3D:Q,pixelStorei:Rt,getParameter:lt,updateUBOMapping:Ct,uniformBlockBinding:zt,texStorage2D:rt,texStorage3D:ot,texSubImage2D:_,texSubImage3D:H,compressedTexSubImage2D:W,compressedTexSubImage3D:Y,scissor:pt,viewport:ct,reset:Gt}}function zv(a,t,e,i,n,s,r){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,h=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ht,c=new WeakMap,u=new Set;let d;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(A,_){return m?new OffscreenCanvas(A,_):Ka("canvas")}function p(A,_,H){let W=1;const Y=me(A);if((Y.width>H||Y.height>H)&&(W=H/Math.max(Y.width,Y.height)),W<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const rt=Math.floor(W*Y.width),ot=Math.floor(W*Y.height);d===void 0&&(d=v(rt,ot));const Z=_?v(rt,ot):d;return Z.width=rt,Z.height=ot,Z.getContext("2d").drawImage(A,0,0,rt,ot),Bt("WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+rt+"x"+ot+")."),Z}else return"data"in A&&Bt("WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),A;return A}function g(A){return A.generateMipmaps}function y(A){a.generateMipmap(A)}function b(A){return A.isWebGLCubeRenderTarget?a.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?a.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?a.TEXTURE_2D_ARRAY:a.TEXTURE_2D}function x(A,_,H,W,Y,rt=!1){if(A!==null){if(a[A]!==void 0)return a[A];Bt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ot;W&&(ot=t.get("EXT_texture_norm16"),ot||Bt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Z=_;if(_===a.RED&&(H===a.FLOAT&&(Z=a.R32F),H===a.HALF_FLOAT&&(Z=a.R16F),H===a.UNSIGNED_BYTE&&(Z=a.R8),H===a.UNSIGNED_SHORT&&ot&&(Z=ot.R16_EXT),H===a.SHORT&&ot&&(Z=ot.R16_SNORM_EXT)),_===a.RED_INTEGER&&(H===a.UNSIGNED_BYTE&&(Z=a.R8UI),H===a.UNSIGNED_SHORT&&(Z=a.R16UI),H===a.UNSIGNED_INT&&(Z=a.R32UI),H===a.BYTE&&(Z=a.R8I),H===a.SHORT&&(Z=a.R16I),H===a.INT&&(Z=a.R32I)),_===a.RG&&(H===a.FLOAT&&(Z=a.RG32F),H===a.HALF_FLOAT&&(Z=a.RG16F),H===a.UNSIGNED_BYTE&&(Z=a.RG8),H===a.UNSIGNED_SHORT&&ot&&(Z=ot.RG16_EXT),H===a.SHORT&&ot&&(Z=ot.RG16_SNORM_EXT)),_===a.RG_INTEGER&&(H===a.UNSIGNED_BYTE&&(Z=a.RG8UI),H===a.UNSIGNED_SHORT&&(Z=a.RG16UI),H===a.UNSIGNED_INT&&(Z=a.RG32UI),H===a.BYTE&&(Z=a.RG8I),H===a.SHORT&&(Z=a.RG16I),H===a.INT&&(Z=a.RG32I)),_===a.RGB_INTEGER&&(H===a.UNSIGNED_BYTE&&(Z=a.RGB8UI),H===a.UNSIGNED_SHORT&&(Z=a.RGB16UI),H===a.UNSIGNED_INT&&(Z=a.RGB32UI),H===a.BYTE&&(Z=a.RGB8I),H===a.SHORT&&(Z=a.RGB16I),H===a.INT&&(Z=a.RGB32I)),_===a.RGBA_INTEGER&&(H===a.UNSIGNED_BYTE&&(Z=a.RGBA8UI),H===a.UNSIGNED_SHORT&&(Z=a.RGBA16UI),H===a.UNSIGNED_INT&&(Z=a.RGBA32UI),H===a.BYTE&&(Z=a.RGBA8I),H===a.SHORT&&(Z=a.RGBA16I),H===a.INT&&(Z=a.RGBA32I)),_===a.RGB&&(H===a.UNSIGNED_SHORT&&ot&&(Z=ot.RGB16_EXT),H===a.SHORT&&ot&&(Z=ot.RGB16_SNORM_EXT),H===a.UNSIGNED_INT_5_9_9_9_REV&&(Z=a.RGB9_E5),H===a.UNSIGNED_INT_10F_11F_11F_REV&&(Z=a.R11F_G11F_B10F)),_===a.RGBA){const Q=rt?Za:Kt.getTransfer(Y);H===a.FLOAT&&(Z=a.RGBA32F),H===a.HALF_FLOAT&&(Z=a.RGBA16F),H===a.UNSIGNED_BYTE&&(Z=Q===fe?a.SRGB8_ALPHA8:a.RGBA8),H===a.UNSIGNED_SHORT&&ot&&(Z=ot.RGBA16_EXT),H===a.SHORT&&ot&&(Z=ot.RGBA16_SNORM_EXT),H===a.UNSIGNED_SHORT_4_4_4_4&&(Z=a.RGBA4),H===a.UNSIGNED_SHORT_5_5_5_1&&(Z=a.RGB5_A1)}return(Z===a.R16F||Z===a.R32F||Z===a.RG16F||Z===a.RG32F||Z===a.RGBA16F||Z===a.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function S(A,_){let H;return A?_===null||_===Zi||_===qs?H=a.DEPTH24_STENCIL8:_===Di?H=a.DEPTH32F_STENCIL8:_===Xs&&(H=a.DEPTH24_STENCIL8,Bt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Zi||_===qs?H=a.DEPTH_COMPONENT24:_===Di?H=a.DEPTH_COMPONENT32F:_===Xs&&(H=a.DEPTH_COMPONENT16),H}function T(A,_){return g(A)===!0||A.isFramebufferTexture&&A.minFilter!==Xe&&A.minFilter!==Qe?Math.log2(Math.max(_.width,_.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?_.mipmaps.length:1}function R(A){const _=A.target;_.removeEventListener("dispose",R),E(_),_.isVideoTexture&&c.delete(_),_.isHTMLTexture&&u.delete(_)}function M(A){const _=A.target;_.removeEventListener("dispose",M),N(_)}function E(A){const _=i.get(A);if(_.__webglInit===void 0)return;const H=A.source,W=f.get(H);if(W){const Y=W[_.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&L(A),Object.keys(W).length===0&&f.delete(H)}i.remove(A)}function L(A){const _=i.get(A);a.deleteTexture(_.__webglTexture);const H=A.source,W=f.get(H);delete W[_.__cacheKey],r.memory.textures--}function N(A){const _=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(_.__webglFramebuffer[W]))for(let Y=0;Y<_.__webglFramebuffer[W].length;Y++)a.deleteFramebuffer(_.__webglFramebuffer[W][Y]);else a.deleteFramebuffer(_.__webglFramebuffer[W]);_.__webglDepthbuffer&&a.deleteRenderbuffer(_.__webglDepthbuffer[W])}else{if(Array.isArray(_.__webglFramebuffer))for(let W=0;W<_.__webglFramebuffer.length;W++)a.deleteFramebuffer(_.__webglFramebuffer[W]);else a.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&a.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&a.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let W=0;W<_.__webglColorRenderbuffer.length;W++)_.__webglColorRenderbuffer[W]&&a.deleteRenderbuffer(_.__webglColorRenderbuffer[W]);_.__webglDepthRenderbuffer&&a.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const H=A.textures;for(let W=0,Y=H.length;W<Y;W++){const rt=i.get(H[W]);rt.__webglTexture&&(a.deleteTexture(rt.__webglTexture),r.memory.textures--),i.remove(H[W])}i.remove(A)}let k=0;function D(){k=0}function I(){return k}function P(A){k=A}function B(){const A=k;return A>=n.maxTextures&&Bt("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+n.maxTextures),k+=1,A}function O(A){const _=[];return _.push(A.wrapS),_.push(A.wrapT),_.push(A.wrapR||0),_.push(A.magFilter),_.push(A.minFilter),_.push(A.anisotropy),_.push(A.internalFormat),_.push(A.format),_.push(A.type),_.push(A.generateMipmaps),_.push(A.premultiplyAlpha),_.push(A.flipY),_.push(A.unpackAlignment),_.push(A.colorSpace),_.join()}function j(A,_){const H=i.get(A);if(A.isVideoTexture&&z(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&H.__version!==A.version){const W=A.image;if(W===null)Bt("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Bt("WebGLRenderer: Texture marked for update but image is incomplete");else{wt(H,A,_);return}}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(a.TEXTURE_2D,H.__webglTexture,a.TEXTURE0+_)}function q(A,_){const H=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){wt(H,A,_);return}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(a.TEXTURE_2D_ARRAY,H.__webglTexture,a.TEXTURE0+_)}function tt(A,_){const H=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){wt(H,A,_);return}e.bindTexture(a.TEXTURE_3D,H.__webglTexture,a.TEXTURE0+_)}function it(A,_){const H=i.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&H.__version!==A.version){Ot(H,A,_);return}e.bindTexture(a.TEXTURE_CUBE_MAP,H.__webglTexture,a.TEXTURE0+_)}const It={[po]:a.REPEAT,[rn]:a.CLAMP_TO_EDGE,[mo]:a.MIRRORED_REPEAT},Tt={[Xe]:a.NEAREST,[vu]:a.NEAREST_MIPMAP_NEAREST,[sa]:a.NEAREST_MIPMAP_LINEAR,[Qe]:a.LINEAR,[dr]:a.LINEAR_MIPMAP_NEAREST,[In]:a.LINEAR_MIPMAP_LINEAR},ce={[Mu]:a.NEVER,[Eu]:a.ALWAYS,[wu]:a.LESS,[mh]:a.LEQUAL,[bu]:a.EQUAL,[gh]:a.GEQUAL,[Su]:a.GREATER,[Tu]:a.NOTEQUAL};function Qt(A,_){if(_.type===Di&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Qe||_.magFilter===dr||_.magFilter===sa||_.magFilter===In||_.minFilter===Qe||_.minFilter===dr||_.minFilter===sa||_.minFilter===In)&&Bt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),a.texParameteri(A,a.TEXTURE_WRAP_S,It[_.wrapS]),a.texParameteri(A,a.TEXTURE_WRAP_T,It[_.wrapT]),(A===a.TEXTURE_3D||A===a.TEXTURE_2D_ARRAY)&&a.texParameteri(A,a.TEXTURE_WRAP_R,It[_.wrapR]),a.texParameteri(A,a.TEXTURE_MAG_FILTER,Tt[_.magFilter]),a.texParameteri(A,a.TEXTURE_MIN_FILTER,Tt[_.minFilter]),_.compareFunction&&(a.texParameteri(A,a.TEXTURE_COMPARE_MODE,a.COMPARE_REF_TO_TEXTURE),a.texParameteri(A,a.TEXTURE_COMPARE_FUNC,ce[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Xe||_.minFilter!==sa&&_.minFilter!==In||_.type===Di&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){const H=t.get("EXT_texture_filter_anisotropic");a.texParameterf(A,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,n.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function oe(A,_){let H=!1;A.__webglInit===void 0&&(A.__webglInit=!0,_.addEventListener("dispose",R));const W=_.source;let Y=f.get(W);Y===void 0&&(Y={},f.set(W,Y));const rt=O(_);if(rt!==A.__cacheKey){Y[rt]===void 0&&(Y[rt]={texture:a.createTexture(),usedTimes:0},r.memory.textures++,H=!0),Y[rt].usedTimes++;const ot=Y[A.__cacheKey];ot!==void 0&&(Y[A.__cacheKey].usedTimes--,ot.usedTimes===0&&L(_)),A.__cacheKey=rt,A.__webglTexture=Y[rt].texture}return H}function $(A,_,H){return Math.floor(Math.floor(A/H)/_)}function et(A,_,H,W){const rt=A.updateRanges;if(rt.length===0)e.texSubImage2D(a.TEXTURE_2D,0,0,0,_.width,_.height,H,W,_.data);else{rt.sort((Rt,pt)=>Rt.start-pt.start);let ot=0;for(let Rt=1;Rt<rt.length;Rt++){const pt=rt[ot],ct=rt[Rt],Ct=pt.start+pt.count,zt=$(ct.start,_.width,4),Gt=$(pt.start,_.width,4);ct.start<=Ct+1&&zt===Gt&&$(ct.start+ct.count-1,_.width,4)===zt?pt.count=Math.max(pt.count,ct.start+ct.count-pt.start):(++ot,rt[ot]=ct)}rt.length=ot+1;const Z=e.getParameter(a.UNPACK_ROW_LENGTH),Q=e.getParameter(a.UNPACK_SKIP_PIXELS),lt=e.getParameter(a.UNPACK_SKIP_ROWS);e.pixelStorei(a.UNPACK_ROW_LENGTH,_.width);for(let Rt=0,pt=rt.length;Rt<pt;Rt++){const ct=rt[Rt],Ct=Math.floor(ct.start/4),zt=Math.ceil(ct.count/4),Gt=Ct%_.width,F=Math.floor(Ct/_.width),dt=zt,K=1;e.pixelStorei(a.UNPACK_SKIP_PIXELS,Gt),e.pixelStorei(a.UNPACK_SKIP_ROWS,F),e.texSubImage2D(a.TEXTURE_2D,0,Gt,F,dt,K,H,W,_.data)}A.clearUpdateRanges(),e.pixelStorei(a.UNPACK_ROW_LENGTH,Z),e.pixelStorei(a.UNPACK_SKIP_PIXELS,Q),e.pixelStorei(a.UNPACK_SKIP_ROWS,lt)}}function wt(A,_,H){let W=a.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(W=a.TEXTURE_2D_ARRAY),_.isData3DTexture&&(W=a.TEXTURE_3D);const Y=oe(A,_),rt=_.source;e.bindTexture(W,A.__webglTexture,a.TEXTURE0+H);const ot=i.get(rt);if(rt.version!==ot.__version||Y===!0){if(e.activeTexture(a.TEXTURE0+H),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const K=Kt.getPrimaries(Kt.workingColorSpace),ut=_.colorSpace===Mn?null:Kt.getPrimaries(_.colorSpace),xt=_.colorSpace===Mn||K===ut?a.NONE:a.BROWSER_DEFAULT_WEBGL;e.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt)}e.pixelStorei(a.UNPACK_ALIGNMENT,_.unpackAlignment);let Q=p(_.image,!1,n.maxTextureSize);Q=Ye(_,Q);const lt=s.convert(_.format,_.colorSpace),Rt=s.convert(_.type);let pt=x(_.internalFormat,lt,Rt,_.normalized,_.colorSpace,_.isVideoTexture);Qt(W,_);let ct;const Ct=_.mipmaps,zt=_.isVideoTexture!==!0,Gt=ot.__version===void 0||Y===!0,F=rt.dataReady,dt=T(_,Q);if(_.isDepthTexture)pt=S(_.format===Nn,_.type),Gt&&(zt?e.texStorage2D(a.TEXTURE_2D,1,pt,Q.width,Q.height):e.texImage2D(a.TEXTURE_2D,0,pt,Q.width,Q.height,0,lt,Rt,null));else if(_.isDataTexture)if(Ct.length>0){zt&&Gt&&e.texStorage2D(a.TEXTURE_2D,dt,pt,Ct[0].width,Ct[0].height);for(let K=0,ut=Ct.length;K<ut;K++)ct=Ct[K],zt?F&&e.texSubImage2D(a.TEXTURE_2D,K,0,0,ct.width,ct.height,lt,Rt,ct.data):e.texImage2D(a.TEXTURE_2D,K,pt,ct.width,ct.height,0,lt,Rt,ct.data);_.generateMipmaps=!1}else zt?(Gt&&e.texStorage2D(a.TEXTURE_2D,dt,pt,Q.width,Q.height),F&&et(_,Q,lt,Rt)):e.texImage2D(a.TEXTURE_2D,0,pt,Q.width,Q.height,0,lt,Rt,Q.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){zt&&Gt&&e.texStorage3D(a.TEXTURE_2D_ARRAY,dt,pt,Ct[0].width,Ct[0].height,Q.depth);for(let K=0,ut=Ct.length;K<ut;K++)if(ct=Ct[K],_.format!==Ii)if(lt!==null)if(zt){if(F)if(_.layerUpdates.size>0){const xt=El(ct.width,ct.height,_.format,_.type);for(const st of _.layerUpdates){const Lt=ct.data.subarray(st*xt/ct.data.BYTES_PER_ELEMENT,(st+1)*xt/ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,K,0,0,st,ct.width,ct.height,1,lt,Lt)}}else e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,K,0,0,0,ct.width,ct.height,Q.depth,lt,ct.data)}else e.compressedTexImage3D(a.TEXTURE_2D_ARRAY,K,pt,ct.width,ct.height,Q.depth,0,ct.data,0,0);else Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else zt?F&&e.texSubImage3D(a.TEXTURE_2D_ARRAY,K,0,0,0,ct.width,ct.height,Q.depth,lt,Rt,ct.data):e.texImage3D(a.TEXTURE_2D_ARRAY,K,pt,ct.width,ct.height,Q.depth,0,lt,Rt,ct.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{zt&&Gt&&e.texStorage2D(a.TEXTURE_2D,dt,pt,Ct[0].width,Ct[0].height);for(let K=0,ut=Ct.length;K<ut;K++)ct=Ct[K],_.format!==Ii?lt!==null?zt?F&&e.compressedTexSubImage2D(a.TEXTURE_2D,K,0,0,ct.width,ct.height,lt,ct.data):e.compressedTexImage2D(a.TEXTURE_2D,K,pt,ct.width,ct.height,0,ct.data):Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):zt?F&&e.texSubImage2D(a.TEXTURE_2D,K,0,0,ct.width,ct.height,lt,Rt,ct.data):e.texImage2D(a.TEXTURE_2D,K,pt,ct.width,ct.height,0,lt,Rt,ct.data)}else if(_.isDataArrayTexture)if(zt){if(Gt&&e.texStorage3D(a.TEXTURE_2D_ARRAY,dt,pt,Q.width,Q.height,Q.depth),F)if(_.layerUpdates.size>0){const K=El(Q.width,Q.height,_.format,_.type);for(const ut of _.layerUpdates){const xt=Q.data.subarray(ut*K/Q.data.BYTES_PER_ELEMENT,(ut+1)*K/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,ut,Q.width,Q.height,1,lt,Rt,xt)}_.clearLayerUpdates()}else e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,lt,Rt,Q.data)}else e.texImage3D(a.TEXTURE_2D_ARRAY,0,pt,Q.width,Q.height,Q.depth,0,lt,Rt,Q.data);else if(_.isData3DTexture)zt?(Gt&&e.texStorage3D(a.TEXTURE_3D,dt,pt,Q.width,Q.height,Q.depth),F&&e.texSubImage3D(a.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,lt,Rt,Q.data)):e.texImage3D(a.TEXTURE_3D,0,pt,Q.width,Q.height,Q.depth,0,lt,Rt,Q.data);else if(_.isFramebufferTexture){if(Gt)if(zt)e.texStorage2D(a.TEXTURE_2D,dt,pt,Q.width,Q.height);else{let K=Q.width,ut=Q.height;for(let xt=0;xt<dt;xt++)e.texImage2D(a.TEXTURE_2D,xt,pt,K,ut,0,lt,Rt,null),K>>=1,ut>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in a){const K=a.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),Q.parentNode!==K){K.appendChild(Q),u.add(_),K.onpaint=ut=>{const xt=ut.changedElements;for(const st of u)xt.includes(st.image)&&(st.needsUpdate=!0)},K.requestPaint();return}if(a.texElementImage2D.length===3)a.texElementImage2D(a.TEXTURE_2D,a.RGBA8,Q);else{const xt=a.RGBA,st=a.RGBA,Lt=a.UNSIGNED_BYTE;a.texElementImage2D(a.TEXTURE_2D,0,xt,st,Lt,Q)}a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE)}}else if(Ct.length>0){if(zt&&Gt){const K=me(Ct[0]);e.texStorage2D(a.TEXTURE_2D,dt,pt,K.width,K.height)}for(let K=0,ut=Ct.length;K<ut;K++)ct=Ct[K],zt?F&&e.texSubImage2D(a.TEXTURE_2D,K,0,0,lt,Rt,ct):e.texImage2D(a.TEXTURE_2D,K,pt,lt,Rt,ct);_.generateMipmaps=!1}else if(zt){if(Gt){const K=me(Q);e.texStorage2D(a.TEXTURE_2D,dt,pt,K.width,K.height)}F&&e.texSubImage2D(a.TEXTURE_2D,0,0,0,lt,Rt,Q)}else e.texImage2D(a.TEXTURE_2D,0,pt,lt,Rt,Q);g(_)&&y(W),ot.__version=rt.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function Ot(A,_,H){if(_.image.length!==6)return;const W=oe(A,_),Y=_.source;e.bindTexture(a.TEXTURE_CUBE_MAP,A.__webglTexture,a.TEXTURE0+H);const rt=i.get(Y);if(Y.version!==rt.__version||W===!0){e.activeTexture(a.TEXTURE0+H);const ot=Kt.getPrimaries(Kt.workingColorSpace),Z=_.colorSpace===Mn?null:Kt.getPrimaries(_.colorSpace),Q=_.colorSpace===Mn||ot===Z?a.NONE:a.BROWSER_DEFAULT_WEBGL;e.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(a.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);const lt=_.isCompressedTexture||_.image[0].isCompressedTexture,Rt=_.image[0]&&_.image[0].isDataTexture,pt=[];for(let st=0;st<6;st++)!lt&&!Rt?pt[st]=p(_.image[st],!0,n.maxCubemapSize):pt[st]=Rt?_.image[st].image:_.image[st],pt[st]=Ye(_,pt[st]);const ct=pt[0],Ct=s.convert(_.format,_.colorSpace),zt=s.convert(_.type),Gt=x(_.internalFormat,Ct,zt,_.normalized,_.colorSpace),F=_.isVideoTexture!==!0,dt=rt.__version===void 0||W===!0,K=Y.dataReady;let ut=T(_,ct);Qt(a.TEXTURE_CUBE_MAP,_);let xt;if(lt){F&&dt&&e.texStorage2D(a.TEXTURE_CUBE_MAP,ut,Gt,ct.width,ct.height);for(let st=0;st<6;st++){xt=pt[st].mipmaps;for(let Lt=0;Lt<xt.length;Lt++){const Et=xt[Lt];_.format!==Ii?Ct!==null?F?K&&e.compressedTexSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt,0,0,Et.width,Et.height,Ct,Et.data):e.compressedTexImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt,Gt,Et.width,Et.height,0,Et.data):Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?K&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt,0,0,Et.width,Et.height,Ct,zt,Et.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt,Gt,Et.width,Et.height,0,Ct,zt,Et.data)}}}else{if(xt=_.mipmaps,F&&dt){xt.length>0&&ut++;const st=me(pt[0]);e.texStorage2D(a.TEXTURE_CUBE_MAP,ut,Gt,st.width,st.height)}for(let st=0;st<6;st++)if(Rt){F?K&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,pt[st].width,pt[st].height,Ct,zt,pt[st].data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Gt,pt[st].width,pt[st].height,0,Ct,zt,pt[st].data);for(let Lt=0;Lt<xt.length;Lt++){const ye=xt[Lt].image[st].image;F?K&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt+1,0,0,ye.width,ye.height,Ct,zt,ye.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt+1,Gt,ye.width,ye.height,0,Ct,zt,ye.data)}}else{F?K&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,Ct,zt,pt[st]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Gt,Ct,zt,pt[st]);for(let Lt=0;Lt<xt.length;Lt++){const Et=xt[Lt];F?K&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt+1,0,0,Ct,zt,Et.image[st]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+st,Lt+1,Gt,Ct,zt,Et.image[st])}}}g(_)&&y(a.TEXTURE_CUBE_MAP),rt.__version=Y.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function _t(A,_,H,W,Y,rt){const ot=s.convert(H.format,H.colorSpace),Z=s.convert(H.type),Q=x(H.internalFormat,ot,Z,H.normalized,H.colorSpace),lt=i.get(_),Rt=i.get(H);if(Rt.__renderTarget=_,!lt.__hasExternalTextures){const pt=Math.max(1,_.width>>rt),ct=Math.max(1,_.height>>rt);Y===a.TEXTURE_3D||Y===a.TEXTURE_2D_ARRAY?e.texImage3D(Y,rt,Q,pt,ct,_.depth,0,ot,Z,null):e.texImage2D(Y,rt,Q,pt,ct,0,ot,Z,null)}e.bindFramebuffer(a.FRAMEBUFFER,A),Ie(_)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,W,Y,Rt.__webglTexture,0,Te(_)):(Y===a.TEXTURE_2D||Y>=a.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=a.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&a.framebufferTexture2D(a.FRAMEBUFFER,W,Y,Rt.__webglTexture,rt),e.bindFramebuffer(a.FRAMEBUFFER,null)}function Xt(A,_,H){if(a.bindRenderbuffer(a.RENDERBUFFER,A),_.depthBuffer){const W=_.depthTexture,Y=W&&W.isDepthTexture?W.type:null,rt=S(_.stencilBuffer,Y),ot=_.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT;Ie(_)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,Te(_),rt,_.width,_.height):H?a.renderbufferStorageMultisample(a.RENDERBUFFER,Te(_),rt,_.width,_.height):a.renderbufferStorage(a.RENDERBUFFER,rt,_.width,_.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,ot,a.RENDERBUFFER,A)}else{const W=_.textures;for(let Y=0;Y<W.length;Y++){const rt=W[Y],ot=s.convert(rt.format,rt.colorSpace),Z=s.convert(rt.type),Q=x(rt.internalFormat,ot,Z,rt.normalized,rt.colorSpace);Ie(_)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,Te(_),Q,_.width,_.height):H?a.renderbufferStorageMultisample(a.RENDERBUFFER,Te(_),Q,_.width,_.height):a.renderbufferStorage(a.RENDERBUFFER,Q,_.width,_.height)}}a.bindRenderbuffer(a.RENDERBUFFER,null)}function Fe(A,_,H){const W=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(a.FRAMEBUFFER,A),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Y=i.get(_.depthTexture);if(Y.__renderTarget=_,(!Y.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),W){if(Y.__webglInit===void 0&&(Y.__webglInit=!0,_.depthTexture.addEventListener("dispose",R)),Y.__webglTexture===void 0){Y.__webglTexture=a.createTexture(),e.bindTexture(a.TEXTURE_CUBE_MAP,Y.__webglTexture),Qt(a.TEXTURE_CUBE_MAP,_.depthTexture);const lt=s.convert(_.depthTexture.format),Rt=s.convert(_.depthTexture.type);let pt;_.depthTexture.format===hn?pt=a.DEPTH_COMPONENT24:_.depthTexture.format===Nn&&(pt=a.DEPTH24_STENCIL8);for(let ct=0;ct<6;ct++)a.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,pt,_.width,_.height,0,lt,Rt,null)}}else j(_.depthTexture,0);const rt=Y.__webglTexture,ot=Te(_),Z=W?a.TEXTURE_CUBE_MAP_POSITIVE_X+H:a.TEXTURE_2D,Q=_.depthTexture.format===Nn?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT;if(_.depthTexture.format===hn)Ie(_)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,Q,Z,rt,0,ot):a.framebufferTexture2D(a.FRAMEBUFFER,Q,Z,rt,0);else if(_.depthTexture.format===Nn)Ie(_)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,Q,Z,rt,0,ot):a.framebufferTexture2D(a.FRAMEBUFFER,Q,Z,rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function qt(A){const _=i.get(A),H=A.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==A.depthTexture){const W=A.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),W){const Y=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,W.removeEventListener("dispose",Y)};W.addEventListener("dispose",Y),_.__depthDisposeCallback=Y}_.__boundDepthTexture=W}if(A.depthTexture&&!_.__autoAllocateDepthBuffer)if(H)for(let W=0;W<6;W++)Fe(_.__webglFramebuffer[W],A,W);else{const W=A.texture.mipmaps;W&&W.length>0?Fe(_.__webglFramebuffer[0],A,0):Fe(_.__webglFramebuffer,A,0)}else if(H){_.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(e.bindFramebuffer(a.FRAMEBUFFER,_.__webglFramebuffer[W]),_.__webglDepthbuffer[W]===void 0)_.__webglDepthbuffer[W]=a.createRenderbuffer(),Xt(_.__webglDepthbuffer[W],A,!1);else{const Y=A.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,rt=_.__webglDepthbuffer[W];a.bindRenderbuffer(a.RENDERBUFFER,rt),a.framebufferRenderbuffer(a.FRAMEBUFFER,Y,a.RENDERBUFFER,rt)}}else{const W=A.texture.mipmaps;if(W&&W.length>0?e.bindFramebuffer(a.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(a.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=a.createRenderbuffer(),Xt(_.__webglDepthbuffer,A,!1);else{const Y=A.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,rt=_.__webglDepthbuffer;a.bindRenderbuffer(a.RENDERBUFFER,rt),a.framebufferRenderbuffer(a.FRAMEBUFFER,Y,a.RENDERBUFFER,rt)}}e.bindFramebuffer(a.FRAMEBUFFER,null)}function se(A,_,H){const W=i.get(A);_!==void 0&&_t(W.__webglFramebuffer,A,A.texture,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,0),H!==void 0&&qt(A)}function xe(A){const _=A.texture,H=i.get(A),W=i.get(_);A.addEventListener("dispose",M);const Y=A.textures,rt=A.isWebGLCubeRenderTarget===!0,ot=Y.length>1;if(ot||(W.__webglTexture===void 0&&(W.__webglTexture=a.createTexture()),W.__version=_.version,r.memory.textures++),rt){H.__webglFramebuffer=[];for(let Z=0;Z<6;Z++)if(_.mipmaps&&_.mipmaps.length>0){H.__webglFramebuffer[Z]=[];for(let Q=0;Q<_.mipmaps.length;Q++)H.__webglFramebuffer[Z][Q]=a.createFramebuffer()}else H.__webglFramebuffer[Z]=a.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){H.__webglFramebuffer=[];for(let Z=0;Z<_.mipmaps.length;Z++)H.__webglFramebuffer[Z]=a.createFramebuffer()}else H.__webglFramebuffer=a.createFramebuffer();if(ot)for(let Z=0,Q=Y.length;Z<Q;Z++){const lt=i.get(Y[Z]);lt.__webglTexture===void 0&&(lt.__webglTexture=a.createTexture(),r.memory.textures++)}if(A.samples>0&&Ie(A)===!1){H.__webglMultisampledFramebuffer=a.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(a.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let Z=0;Z<Y.length;Z++){const Q=Y[Z];H.__webglColorRenderbuffer[Z]=a.createRenderbuffer(),a.bindRenderbuffer(a.RENDERBUFFER,H.__webglColorRenderbuffer[Z]);const lt=s.convert(Q.format,Q.colorSpace),Rt=s.convert(Q.type),pt=x(Q.internalFormat,lt,Rt,Q.normalized,Q.colorSpace,A.isXRRenderTarget===!0),ct=Te(A);a.renderbufferStorageMultisample(a.RENDERBUFFER,ct,pt,A.width,A.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+Z,a.RENDERBUFFER,H.__webglColorRenderbuffer[Z])}a.bindRenderbuffer(a.RENDERBUFFER,null),A.depthBuffer&&(H.__webglDepthRenderbuffer=a.createRenderbuffer(),Xt(H.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(a.FRAMEBUFFER,null)}}if(rt){e.bindTexture(a.TEXTURE_CUBE_MAP,W.__webglTexture),Qt(a.TEXTURE_CUBE_MAP,_);for(let Z=0;Z<6;Z++)if(_.mipmaps&&_.mipmaps.length>0)for(let Q=0;Q<_.mipmaps.length;Q++)_t(H.__webglFramebuffer[Z][Q],A,_,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+Z,Q);else _t(H.__webglFramebuffer[Z],A,_,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0);g(_)&&y(a.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ot){for(let Z=0,Q=Y.length;Z<Q;Z++){const lt=Y[Z],Rt=i.get(lt);let pt=a.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(pt=A.isWebGL3DRenderTarget?a.TEXTURE_3D:a.TEXTURE_2D_ARRAY),e.bindTexture(pt,Rt.__webglTexture),Qt(pt,lt),_t(H.__webglFramebuffer,A,lt,a.COLOR_ATTACHMENT0+Z,pt,0),g(lt)&&y(pt)}e.unbindTexture()}else{let Z=a.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Z=A.isWebGL3DRenderTarget?a.TEXTURE_3D:a.TEXTURE_2D_ARRAY),e.bindTexture(Z,W.__webglTexture),Qt(Z,_),_.mipmaps&&_.mipmaps.length>0)for(let Q=0;Q<_.mipmaps.length;Q++)_t(H.__webglFramebuffer[Q],A,_,a.COLOR_ATTACHMENT0,Z,Q);else _t(H.__webglFramebuffer,A,_,a.COLOR_ATTACHMENT0,Z,0);g(_)&&y(Z),e.unbindTexture()}A.depthBuffer&&qt(A)}function Zt(A){const _=A.textures;for(let H=0,W=_.length;H<W;H++){const Y=_[H];if(g(Y)){const rt=b(A),ot=i.get(Y).__webglTexture;e.bindTexture(rt,ot),y(rt),e.unbindTexture()}}}const be=[],Ge=[];function ai(A){if(A.samples>0){if(Ie(A)===!1){const _=A.textures,H=A.width,W=A.height;let Y=a.COLOR_BUFFER_BIT;const rt=A.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,ot=i.get(A),Z=_.length>1;if(Z)for(let lt=0;lt<_.length;lt++)e.bindFramebuffer(a.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+lt,a.RENDERBUFFER,null),e.bindFramebuffer(a.FRAMEBUFFER,ot.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+lt,a.TEXTURE_2D,null,0);e.bindFramebuffer(a.READ_FRAMEBUFFER,ot.__webglMultisampledFramebuffer);const Q=A.texture.mipmaps;Q&&Q.length>0?e.bindFramebuffer(a.DRAW_FRAMEBUFFER,ot.__webglFramebuffer[0]):e.bindFramebuffer(a.DRAW_FRAMEBUFFER,ot.__webglFramebuffer);for(let lt=0;lt<_.length;lt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Y|=a.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Y|=a.STENCIL_BUFFER_BIT)),Z){a.framebufferRenderbuffer(a.READ_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.RENDERBUFFER,ot.__webglColorRenderbuffer[lt]);const Rt=i.get(_[lt]).__webglTexture;a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,Rt,0)}a.blitFramebuffer(0,0,H,W,0,0,H,W,Y,a.NEAREST),h===!0&&(be.length=0,Ge.length=0,be.push(a.COLOR_ATTACHMENT0+lt),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&(be.push(rt),Ge.push(rt),a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,Ge)),a.invalidateFramebuffer(a.READ_FRAMEBUFFER,be))}if(e.bindFramebuffer(a.READ_FRAMEBUFFER,null),e.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),Z)for(let lt=0;lt<_.length;lt++){e.bindFramebuffer(a.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+lt,a.RENDERBUFFER,ot.__webglColorRenderbuffer[lt]);const Rt=i.get(_[lt]).__webglTexture;e.bindFramebuffer(a.FRAMEBUFFER,ot.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+lt,a.TEXTURE_2D,Rt,0)}e.bindFramebuffer(a.DRAW_FRAMEBUFFER,ot.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&h){const _=A.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT;a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,[_])}}}function Te(A){return Math.min(n.maxSamples,A.samples)}function Ie(A){const _=i.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function z(A){const _=r.render.frame;c.get(A)!==_&&(c.set(A,_),A.update())}function Ye(A,_){const H=A.colorSpace,W=A.format,Y=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||H!==$a&&H!==Mn&&(Kt.getTransfer(H)===fe?(W!==Ii||Y!==vi)&&Bt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):re("WebGLTextures: Unsupported texture color space:",H)),_}function me(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=B,this.resetTextureUnits=D,this.getTextureUnits=I,this.setTextureUnits=P,this.setTexture2D=j,this.setTexture2DArray=q,this.setTexture3D=tt,this.setTextureCube=it,this.rebindTextures=se,this.setupRenderTarget=xe,this.updateRenderTargetMipmap=Zt,this.updateMultisampleRenderTarget=ai,this.setupDepthRenderbuffer=qt,this.setupFrameBufferTexture=_t,this.useMultisampledRTT=Ie,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Bv(a,t){function e(i,n=Mn){let s;const r=Kt.getTransfer(n);if(i===vi)return a.UNSIGNED_BYTE;if(i===lh)return a.UNSIGNED_SHORT_4_4_4_4;if(i===ch)return a.UNSIGNED_SHORT_5_5_5_1;if(i===zc)return a.UNSIGNED_INT_5_9_9_9_REV;if(i===Bc)return a.UNSIGNED_INT_10F_11F_11F_REV;if(i===Uc)return a.BYTE;if(i===Fc)return a.SHORT;if(i===Xs)return a.UNSIGNED_SHORT;if(i===hh)return a.INT;if(i===Zi)return a.UNSIGNED_INT;if(i===Di)return a.FLOAT;if(i===ci)return a.HALF_FLOAT;if(i===Oc)return a.ALPHA;if(i===Hc)return a.RGB;if(i===Ii)return a.RGBA;if(i===hn)return a.DEPTH_COMPONENT;if(i===Nn)return a.DEPTH_STENCIL;if(i===dh)return a.RED;if(i===uh)return a.RED_INTEGER;if(i===zn)return a.RG;if(i===fh)return a.RG_INTEGER;if(i===ph)return a.RGBA_INTEGER;if(i===Ba||i===Oa||i===Ha||i===Ga)if(r===fe)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Ba)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Oa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ha)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ga)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Ba)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Oa)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ha)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ga)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===go||i===vo||i===xo||i===yo)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===go)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===vo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===xo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===yo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===_o||i===Mo||i===wo||i===bo||i===So||i===qa||i===To)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(i===_o||i===Mo)return r===fe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===wo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===bo)return s.COMPRESSED_R11_EAC;if(i===So)return s.COMPRESSED_SIGNED_R11_EAC;if(i===qa)return s.COMPRESSED_RG11_EAC;if(i===To)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Eo||i===Ao||i===Ro||i===Co||i===Po||i===ko||i===Lo||i===Do||i===Io||i===No||i===Uo||i===Fo||i===zo||i===Bo)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Eo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ao)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Ro)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Co)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Po)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ko)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Lo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Do)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Io)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===No)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Uo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Fo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===zo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Bo)return r===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Oo||i===Ho||i===Go)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(i===Oo)return r===fe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ho)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Go)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Vo||i===Wo||i===Ya||i===Xo)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(i===Vo)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Wo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ya)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Xo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===qs?a.UNSIGNED_INT_24_8:a[i]!==void 0?a[i]:null}return{convert:e}}const Ov=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Hv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Gv{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const i=new Jc(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new Be({vertexShader:Ov,fragmentShader:Hv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new J(new Tn(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Vv extends Hn{constructor(t,e){super();const i=this;let n=null,s=1,r=null,o="local-floor",h=1,l=null,c=null,u=null,d=null,f=null,m=null;const v=typeof XRWebGLBinding<"u",p=new Gv,g={},y=e.getContextAttributes();let b=null,x=null;const S=[],T=[],R=new ht;let M=null,E=null;const L=new gi;L.viewport=new Re;const N=new gi;N.viewport=new Re;const k=[L,N],D=new Zf;let I=null,P=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let et=S[$];return et===void 0&&(et=new Mr,S[$]=et),et.getTargetRaySpace()},this.getControllerGrip=function($){let et=S[$];return et===void 0&&(et=new Mr,S[$]=et),et.getGripSpace()},this.getHand=function($){let et=S[$];return et===void 0&&(et=new Mr,S[$]=et),et.getHandSpace()};function B($){const et=T.indexOf($.inputSource);if(et===-1)return;const wt=S[et];wt!==void 0&&(wt.update($.inputSource,$.frame,l||r),wt.dispatchEvent({type:$.type,data:$.inputSource}))}function O(){n.removeEventListener("select",B),n.removeEventListener("selectstart",B),n.removeEventListener("selectend",B),n.removeEventListener("squeeze",B),n.removeEventListener("squeezestart",B),n.removeEventListener("squeezeend",B),n.removeEventListener("end",O),n.removeEventListener("inputsourceschange",j);for(let $=0;$<S.length;$++){const et=T[$];et!==null&&(T[$]=null,S[$].disconnect(et))}I=null,P=null,p.reset();for(const $ in g)delete g[$];if(t.setRenderTarget(b),f=null,d=null,u=null,n=null,x=null,oe.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(R.width,R.height,!1),E!==null){const $=E.camera;$.fov=E.fov,$.zoom=E.zoom,$.updateProjectionMatrix(),E=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){s=$,i.isPresenting===!0&&Bt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,i.isPresenting===!0&&Bt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||r},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&v&&(u=new XRWebGLBinding(n,e)),u},this.getFrame=function(){return m},this.getSession=function(){return n},this.setSession=async function($){if(n=$,n!==null){if(b=t.getRenderTarget(),n.addEventListener("select",B),n.addEventListener("selectstart",B),n.addEventListener("selectend",B),n.addEventListener("squeeze",B),n.addEventListener("squeezestart",B),n.addEventListener("squeezeend",B),n.addEventListener("end",O),n.addEventListener("inputsourceschange",j),y.xrCompatible!==!0&&await e.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(R),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let wt=null,Ot=null,_t=null;y.depth&&(_t=y.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,wt=y.stencil?Nn:hn,Ot=y.stencil?qs:Zi);const Xt={colorFormat:e.RGBA8,depthFormat:_t,scaleFactor:s};u=this.getBinding(),d=u.createProjectionLayer(Xt),n.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),x=new ni(d.textureWidth,d.textureHeight,{format:Ii,type:vi,depthTexture:new $s(d.textureWidth,d.textureHeight,Ot,void 0,void 0,void 0,void 0,void 0,void 0,wt),stencilBuffer:y.stencil,colorSpace:t.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{const wt={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(n,e,wt),n.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new ni(f.framebufferWidth,f.framebufferHeight,{format:Ii,type:vi,colorSpace:t.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(h),l=null,r=await n.requestReferenceSpace(o),oe.setContext(n),oe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function j($){for(let et=0;et<$.removed.length;et++){const wt=$.removed[et],Ot=T.indexOf(wt);Ot>=0&&(T[Ot]=null,S[Ot].disconnect(wt))}for(let et=0;et<$.added.length;et++){const wt=$.added[et];let Ot=T.indexOf(wt);if(Ot===-1){for(let Xt=0;Xt<S.length;Xt++)if(Xt>=T.length){T.push(wt),Ot=Xt;break}else if(T[Xt]===null){T[Xt]=wt,Ot=Xt;break}if(Ot===-1)break}const _t=S[Ot];_t&&_t.connect(wt)}}const q=new C,tt=new C;function it($,et,wt){q.setFromMatrixPosition(et.matrixWorld),tt.setFromMatrixPosition(wt.matrixWorld);const Ot=q.distanceTo(tt),_t=et.projectionMatrix.elements,Xt=wt.projectionMatrix.elements,Fe=_t[14]/(_t[10]-1),qt=_t[14]/(_t[10]+1),se=(_t[9]+1)/_t[5],xe=(_t[9]-1)/_t[5],Zt=(_t[8]-1)/_t[0],be=(Xt[8]+1)/Xt[0],Ge=Fe*Zt,ai=Fe*be,Te=Ot/(-Zt+be),Ie=Te*-Zt;if(et.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(Ie),$.translateZ(Te),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),_t[10]===-1)$.projectionMatrix.copy(et.projectionMatrix),$.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{const z=Fe+Te,Ye=qt+Te,me=Ge-Ie,A=ai+(Ot-Ie),_=se*qt/Ye*z,H=xe*qt/Ye*z;$.projectionMatrix.makePerspective(me,A,_,H,z,Ye),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function It($,et){et===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(et.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(n===null)return;let et=$.near,wt=$.far;p.texture!==null&&(p.depthNear>0&&(et=p.depthNear),p.depthFar>0&&(wt=p.depthFar)),D.near=N.near=L.near=et,D.far=N.far=L.far=wt,(I!==D.near||P!==D.far)&&(n.updateRenderState({depthNear:D.near,depthFar:D.far}),I=D.near,P=D.far),D.layers.mask=$.layers.mask|6,L.layers.mask=D.layers.mask&-5,N.layers.mask=D.layers.mask&-3;const Ot=$.parent,_t=D.cameras;It(D,Ot);for(let Xt=0;Xt<_t.length;Xt++)It(_t[Xt],Ot);_t.length===2?it(D,L,N):D.projectionMatrix.copy(L.projectionMatrix),E===null&&$.isPerspectiveCamera&&(E={camera:$,fov:$.fov,zoom:$.zoom}),Tt($,D,Ot)};function Tt($,et,wt){wt===null?$.matrix.copy(et.matrixWorld):($.matrix.copy(wt.matrixWorld),$.matrix.invert(),$.matrix.multiply(et.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(et.projectionMatrix),$.projectionMatrixInverse.copy(et.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Yo*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return D},this.getFoveation=function(){if(!(d===null&&f===null))return h},this.setFoveation=function($){h=$,d!==null&&(d.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(D)},this.getCameraTexture=function($){return g[$]};let ce=null;function Qt($,et){if(c=et.getViewerPose(l||r),m=et,c!==null){const wt=c.views;f!==null&&(t.setRenderTargetFramebuffer(x,f.framebuffer),t.setRenderTarget(x));let Ot=!1;wt.length!==D.cameras.length&&(D.cameras.length=0,Ot=!0);for(let qt=0;qt<wt.length;qt++){const se=wt[qt];let xe=null;if(f!==null)xe=f.getViewport(se);else{const be=u.getViewSubImage(d,se);xe=be.viewport,qt===0&&(t.setRenderTargetTextures(x,be.colorTexture,be.depthStencilTexture),t.setRenderTarget(x))}let Zt=k[qt];Zt===void 0&&(Zt=new gi,Zt.layers.enable(qt),Zt.viewport=new Re,k[qt]=Zt),Zt.matrix.fromArray(se.transform.matrix),Zt.matrix.decompose(Zt.position,Zt.quaternion,Zt.scale),Zt.projectionMatrix.fromArray(se.projectionMatrix),Zt.projectionMatrixInverse.copy(Zt.projectionMatrix).invert(),Zt.viewport.set(xe.x,xe.y,xe.width,xe.height),qt===0&&(D.matrix.copy(Zt.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale)),Ot===!0&&D.cameras.push(Zt)}const _t=n.enabledFeatures;if(_t&&_t.includes("depth-sensing")&&n.depthUsage=="gpu-optimized"&&v){u=i.getBinding();const qt=u.getDepthInformation(wt[0]);qt&&qt.isValid&&qt.texture&&p.init(qt,n.renderState)}if(_t&&_t.includes("camera-access")&&v){t.state.unbindTexture(),u=i.getBinding();for(let qt=0;qt<wt.length;qt++){const se=wt[qt].camera;if(se){let xe=g[se];xe||(xe=new Jc,g[se]=xe);const Zt=u.getCameraImage(se);xe.sourceTexture=Zt}}}}for(let wt=0;wt<S.length;wt++){const Ot=T[wt],_t=S[wt];Ot!==null&&_t!==void 0&&_t.update(Ot,et,l||r)}ce&&ce($,et),et.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:et}),m=null}const oe=new ud;oe.setAnimationLoop(Qt),this.setAnimationLoop=function($){ce=$},this.dispose=function(){}}}const Wv=new pe,yd=new Ht;yd.set(-1,0,0,0,1,0,0,0,1);function Xv(a,t){function e(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function i(p,g){g.color.getRGB(p.fogColor.value,od(a)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function n(p,g,y,b,x){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?s(p,g):g.isMeshLambertMaterial?(s(p,g),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(s(p,g),u(p,g)):g.isMeshPhongMaterial?(s(p,g),c(p,g),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(s(p,g),d(p,g),g.isMeshPhysicalMaterial&&f(p,g,x)):g.isMeshMatcapMaterial?(s(p,g),m(p,g)):g.isMeshDepthMaterial?s(p,g):g.isMeshDistanceMaterial?(s(p,g),v(p,g)):g.isMeshNormalMaterial?s(p,g):g.isLineBasicMaterial?(r(p,g),g.isLineDashedMaterial&&o(p,g)):g.isPointsMaterial?h(p,g,y,b):g.isSpriteMaterial?l(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function s(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,e(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===ei&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,e(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===ei&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,e(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,e(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);const y=t.get(g),b=y.envMap,x=y.envMapRotation;b&&(p.envMap.value=b,p.envMapRotation.value.setFromMatrix4(Wv.makeRotationFromEuler(x)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(yd),p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,p.aoMapTransform))}function r(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform))}function o(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function h(p,g,y,b){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*y,p.scale.value=b*.5,g.map&&(p.map.value=g.map,e(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function l(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function c(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function u(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function d(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,y){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===ei&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.retroreflectivity>0&&(p.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=y.texture,p.transmissionSamplerSize.value.set(y.width,y.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function v(p,g){const y=t.get(g).light;p.referencePosition.value.setFromMatrixPosition(y.matrixWorld),p.nearDistance.value=y.shadow.camera.near,p.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function qv(a,t,e,i){let n={},s={},r=[];const o=a.getParameter(a.MAX_UNIFORM_BUFFER_BINDINGS);function h(x,S){const T=S.program;i.uniformBlockBinding(x,T)}function l(x,S){let T=n[x.id];T===void 0&&(p(x),T=c(x),n[x.id]=T,x.addEventListener("dispose",y));const R=S.program;i.updateUBOMapping(x,R);const M=t.render.frame;s[x.id]!==M&&(d(x),s[x.id]=M)}function c(x){const S=u();x.__bindingPointIndex=S;const T=a.createBuffer(),R=x.__size,M=x.usage;return a.bindBuffer(a.UNIFORM_BUFFER,T),a.bufferData(a.UNIFORM_BUFFER,R,M),a.bindBuffer(a.UNIFORM_BUFFER,null),a.bindBufferBase(a.UNIFORM_BUFFER,S,T),T}function u(){for(let x=0;x<o;x++)if(r.indexOf(x)===-1)return r.push(x),x;return re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){const S=n[x.id],T=x.uniforms,R=x.__cache;a.bindBuffer(a.UNIFORM_BUFFER,S);for(let M=0,E=T.length;M<E;M++){const L=T[M];if(Array.isArray(L))for(let N=0,k=L.length;N<k;N++)f(L[N],M,N,R);else f(L,M,0,R)}a.bindBuffer(a.UNIFORM_BUFFER,null)}function f(x,S,T,R){if(v(x,S,T,R)===!0){const M=x.__offset,E=x.value;if(Array.isArray(E)){let L=0;for(let N=0;N<E.length;N++){const k=E[N],D=g(k);m(k,x.__data,L),typeof k!="number"&&typeof k!="boolean"&&!k.isMatrix3&&!ArrayBuffer.isView(k)&&(L+=D.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(E,x.__data,0);a.bufferSubData(a.UNIFORM_BUFFER,M,x.__data)}}function m(x,S,T){typeof x=="number"||typeof x=="boolean"?S[0]=x:x.isMatrix3?(S[0]=x.elements[0],S[1]=x.elements[1],S[2]=x.elements[2],S[3]=0,S[4]=x.elements[3],S[5]=x.elements[4],S[6]=x.elements[5],S[7]=0,S[8]=x.elements[6],S[9]=x.elements[7],S[10]=x.elements[8],S[11]=0):ArrayBuffer.isView(x)?S.set(new x.constructor(x.buffer,x.byteOffset,S.length)):x.toArray(S,T)}function v(x,S,T,R){const M=x.value,E=S+"_"+T;if(R[E]===void 0)return typeof M=="number"||typeof M=="boolean"?R[E]=M:ArrayBuffer.isView(M)?R[E]=M.slice():R[E]=M.clone(),!0;{const L=R[E];if(typeof M=="number"||typeof M=="boolean"){if(L!==M)return R[E]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(L.equals(M)===!1)return L.copy(M),!0}}return!1}function p(x){const S=x.uniforms;let T=0;const R=16;for(let E=0,L=S.length;E<L;E++){const N=Array.isArray(S[E])?S[E]:[S[E]];for(let k=0,D=N.length;k<D;k++){const I=N[k],P=Array.isArray(I.value)?I.value:[I.value];for(let B=0,O=P.length;B<O;B++){const j=P[B],q=g(j),tt=T%R,it=tt%q.boundary,It=tt+it;T+=it,It!==0&&R-It<q.storage&&(T+=R-It),I.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=T,T+=q.storage}}}const M=T%R;return M>0&&(T+=R-M),x.__size=T,x.__cache={},this}function g(x){const S={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(S.boundary=4,S.storage=4):x.isVector2?(S.boundary=8,S.storage=8):x.isVector3||x.isColor?(S.boundary=16,S.storage=12):x.isVector4?(S.boundary=16,S.storage=16):x.isMatrix3?(S.boundary=48,S.storage=48):x.isMatrix4?(S.boundary=64,S.storage=64):x.isTexture?Bt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(S.boundary=16,S.storage=x.byteLength):Bt("WebGLRenderer: Unsupported uniform value type.",x),S}function y(x){const S=x.target;S.removeEventListener("dispose",y);const T=r.indexOf(S.__bindingPointIndex);r.splice(T,1),a.deleteBuffer(n[S.id]),delete n[S.id],delete s[S.id]}function b(){for(const x in n)a.deleteBuffer(n[x]);r=[],n={},s={}}return{bind:h,update:l,dispose:b}}const Yv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let zi=null;function $v(){return zi===null&&(zi=new Zc(Yv,16,16,zn,ci),zi.name="DFG_LUT",zi.minFilter=Qe,zi.magFilter=Qe,zi.wrapS=rn,zi.wrapT=rn,zi.generateMipmaps=!1,zi.needsUpdate=!0),zi}class Zv{constructor(t={}){const{canvas:e=Cu(),context:i=null,depth:n=!0,stencil:s=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:h=!0,preserveDrawingBuffer:l=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=vi}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=r;const v=f,p=new Set([ph,fh,uh]),g=new Set([vi,Zi,Xs,qs,lh,ch]),y=new Uint32Array(4),b=new Int32Array(4),x=new C;let S=null,T=null;const R=[],M=[];let E=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Yi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const L=this;let N=!1,k=null,D=null,I=null,P=null;this._outputColorSpace=mi;let B=0,O=0,j=null,q=-1,tt=null;const it=new Re,It=new Re;let Tt=null;const ce=new Nt(0);let Qt=0,oe=e.width,$=e.height,et=1,wt=null,Ot=null;const _t=new Re(0,0,oe,$),Xt=new Re(0,0,oe,$);let Fe=!1;const qt=new yh;let se=!1,xe=!1;const Zt=new pe,be=new C,Ge=new Re,ai={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Te=!1;function Ie(){return j===null?et:1}let z=i;function Ye(w,U){return e.getContext(w,U)}let me,A,_,H,W,Y,rt,ot,Z,Q,lt,Rt,pt,ct,Ct,zt,Gt,F,dt,K,ut,xt,st;try{const w={alpha:!0,depth:n,stencil:s,antialias:o,premultipliedAlpha:h,preserveDrawingBuffer:l,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${eh}`),e.addEventListener("webglcontextlost",ye,!1),e.addEventListener("webglcontextrestored",de,!1),e.addEventListener("webglcontextcreationerror",Ti,!1),z===null){const U="webgl2";if(z=Ye(U,w),z===null)throw Ye(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Lt()}catch(w){throw e.removeEventListener("webglcontextlost",ye,!1),e.removeEventListener("webglcontextrestored",de,!1),e.removeEventListener("webglcontextcreationerror",Ti,!1),re("WebGLRenderer: "+w.message),w}function Lt(){me=new $m(z),me.init(),ut=new Bv(z,me),A=new zm(z,me,t,ut),_=new Fv(z,me),A.reversedDepthBuffer&&d&&_.buffers.depth.setReversed(!0),D=z.createFramebuffer(),I=z.createFramebuffer(),P=z.createFramebuffer(),H=new Jm(z),W=new bv,Y=new zv(z,me,_,W,A,ut,H),rt=new Ym(L),ot=new jf(z),xt=new Um(z,ot),Z=new Zm(z,ot,H,xt),Q=new jm(z,Z,ot,xt,H),F=new Qm(z,A,Y),Ct=new Bm(W),lt=new wv(L,rt,me,A,xt,Ct),Rt=new Xv(L,W),pt=new Tv,ct=new kv(me),Gt=new Nm(L,rt,_,Q,m,h),zt=new Uv(L,Q,A),st=new qv(z,H,A,_),dt=new Fm(z,me,H),K=new Km(z,me,H),H.programs=lt.programs,L.capabilities=A,L.extensions=me,L.properties=W,L.renderLists=pt,L.shadowMap=zt,L.state=_,L.info=H}v!==vi&&(E=new eg(v,e.width,e.height,o,n,s));const Et=new Vv(L,z);this.xr=Et,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){const w=me.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=me.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return et},this.setPixelRatio=function(w){w!==void 0&&(et=w,this.setSize(oe,$,!1))},this.getSize=function(w){return w.set(oe,$)},this.setSize=function(w,U,X=!0){if(Et.isPresenting){Bt("WebGLRenderer: Can't change size while VR device is presenting.");return}oe=w,$=U,e.width=Math.floor(w*et),e.height=Math.floor(U*et),X===!0&&(e.style.width=w+"px",e.style.height=U+"px"),E!==null&&E.setSize(e.width,e.height),this.setViewport(0,0,w,U)},this.getDrawingBufferSize=function(w){return w.set(oe*et,$*et).floor()},this.setDrawingBufferSize=function(w,U,X){oe=w,$=U,et=X,e.width=Math.floor(w*X),e.height=Math.floor(U*X),this.setViewport(0,0,w,U)},this.setEffects=function(w){if(v===vi){re("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(w){for(let U=0;U<w.length;U++)if(w[U].isOutputPass===!0){Bt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(w||[])},this.getCurrentViewport=function(w){return w.copy(it)},this.getViewport=function(w){return w.copy(_t)},this.setViewport=function(w,U,X,G){w.isVector4?_t.set(w.x,w.y,w.z,w.w):_t.set(w,U,X,G),_.viewport(it.copy(_t).multiplyScalar(et).round())},this.getScissor=function(w){return w.copy(Xt)},this.setScissor=function(w,U,X,G){w.isVector4?Xt.set(w.x,w.y,w.z,w.w):Xt.set(w,U,X,G),_.scissor(It.copy(Xt).multiplyScalar(et).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(w){_.setScissorTest(Fe=w)},this.setOpaqueSort=function(w){wt=w},this.setTransparentSort=function(w){Ot=w},this.getClearColor=function(w){return w.copy(Gt.getClearColor())},this.setClearColor=function(){Gt.setClearColor(...arguments)},this.getClearAlpha=function(){return Gt.getClearAlpha()},this.setClearAlpha=function(){Gt.setClearAlpha(...arguments)},this.clear=function(w=!0,U=!0,X=!0){let G=0;if(w){let V=!1;if(j!==null){const gt=j.texture.format;V=p.has(gt)}if(V){const gt=j.texture.type,Mt=g.has(gt),mt=Gt.getClearColor(),bt=Gt.getClearAlpha(),At=mt.r,Vt=mt.g,Yt=mt.b;Mt?(y[0]=At,y[1]=Vt,y[2]=Yt,y[3]=bt,z.clearBufferuiv(z.COLOR,0,y)):(b[0]=At,b[1]=Vt,b[2]=Yt,b[3]=bt,z.clearBufferiv(z.COLOR,0,b))}else G|=z.COLOR_BUFFER_BIT}U&&(G|=z.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(G|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&z.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(w){w.setRenderer(this),k=w},this.dispose=function(){e.removeEventListener("webglcontextlost",ye,!1),e.removeEventListener("webglcontextrestored",de,!1),e.removeEventListener("webglcontextcreationerror",Ti,!1),Gt.dispose(),pt.dispose(),ct.dispose(),W.dispose(),rt.dispose(),Q.dispose(),xt.dispose(),st.dispose(),lt.dispose(),Et.dispose(),Et.removeEventListener("sessionstart",Dh),Et.removeEventListener("sessionend",Ih),En.stop()};function ye(w){w.preventDefault(),Yh("WebGLRenderer: Context Lost."),N=!0}function de(){Yh("WebGLRenderer: Context Restored."),N=!1;const w=H.autoReset,U=zt.enabled,X=zt.autoUpdate,G=zt.needsUpdate,V=zt.type;Lt(),H.autoReset=w,zt.enabled=U,zt.autoUpdate=X,zt.needsUpdate=G,zt.type=V}function Ti(w){re("WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Ni(w){const U=w.target;U.removeEventListener("dispose",Ni),Hd(U)}function Hd(w){Gd(w),W.remove(w)}function Gd(w){const U=W.get(w).programs;U!==void 0&&(U.forEach(function(X){lt.releaseProgram(X)}),w.isShaderMaterial&&lt.releaseShaderCache(w))}this.renderBufferDirect=function(w,U,X,G,V,gt){U===null&&(U=ai);const Mt=V.isMesh&&V.matrixWorld.determinantAffine()<0,mt=Xd(w,U,X,G,V);_.setMaterial(G,Mt);let bt=X.index,At=1;if(G.wireframe===!0){if(bt=Z.getWireframeAttribute(X),bt===void 0)return;At=2}const Vt=X.drawRange,Yt=X.attributes.position;let St=Vt.start*At,ue=(Vt.start+Vt.count)*At;gt!==null&&(St=Math.max(St,gt.start*At),ue=Math.min(ue,(gt.start+gt.count)*At)),bt!==null?(St=Math.max(St,0),ue=Math.min(ue,bt.count)):Yt!=null&&(St=Math.max(St,0),ue=Math.min(ue,Yt.count));const Ne=ue-St;if(Ne<0||Ne===1/0)return;xt.setup(V,G,mt,X,bt);let Me,ve=dt;if(bt!==null&&(Me=ot.get(bt),ve=K,ve.setIndex(Me)),V.isMesh)G.wireframe===!0?(_.setLineWidth(G.wireframeLinewidth*Ie()),ve.setMode(z.LINES)):ve.setMode(z.TRIANGLES);else if(V.isLine){let $e=G.linewidth;$e===void 0&&($e=1),_.setLineWidth($e*Ie()),V.isLineSegments?ve.setMode(z.LINES):V.isLineLoop?ve.setMode(z.LINE_LOOP):ve.setMode(z.LINE_STRIP)}else V.isPoints?ve.setMode(z.POINTS):V.isSprite&&ve.setMode(z.TRIANGLES);if(V.isBatchedMesh)if(me.get("WEBGL_multi_draw"))ve.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{const $e=V._multiDrawStarts,yt=V._multiDrawCounts,je=V._multiDrawCount,ee=bt?ot.get(bt).bytesPerElement:1,_i=W.get(G).currentProgram.getUniforms();for(let Ui=0;Ui<je;Ui++)_i.setValue(z,"_gl_DrawID",Ui),ve.render($e[Ui]/ee,yt[Ui])}else if(V.isInstancedMesh)ve.renderInstances(St,Ne,V.count);else if(X.isInstancedBufferGeometry){const $e=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,yt=Math.min(X.instanceCount,$e);ve.renderInstances(St,Ne,yt)}else ve.render(St,Ne)};function Lh(w,U,X,G){k!==null&&w.isNodeMaterial&&k.setObject(G,w),se===!0&&Ct.setState(w,X,!1),w.transparent===!0&&w.side===we&&w.forceSinglePass===!1?(w.side=ei,w.needsUpdate=!0,na(w,U,G),w.side=Sn,w.needsUpdate=!0,na(w,U,G),w.side=we):na(w,U,G)}this.compile=function(w,U,X=null){X===null&&(X=w),k!==null&&k.renderStart(w,U,X),T=ct.get(X),T.init(U),M.push(T),X.traverseVisible(function(V){V.isLight&&V.layers.test(U.layers)&&(T.pushLight(V),V.castShadow&&T.pushShadow(V))}),w!==X&&w.traverseVisible(function(V){V.isLight&&V.layers.test(U.layers)&&(T.pushLight(V),V.castShadow&&T.pushShadow(V))}),T.setupLights(),k!==null&&k.updateLights(T.state.lightsArray),xe=this.localClippingEnabled,se=Ct.init(this.clippingPlanes,xe),se===!0&&Ct.setGlobalState(this.clippingPlanes,U),k!==null&&zt.render(T.state.shadowsArray,X,U);const G=new Set;return w.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;const gt=V.material;if(gt)if(Array.isArray(gt))for(let Mt=0;Mt<gt.length;Mt++){const mt=gt[Mt];Lh(mt,X,U,V),G.add(mt)}else Lh(gt,X,U,V),G.add(gt)}),T=M.pop(),k!==null&&k.renderEnd(),G},this.compileAsync=function(w,U,X=null){const G=this.compile(w,U,X);return new Promise(V=>{function gt(){if(G.forEach(function(Mt){const bt=W.get(Mt).currentProgram;(bt===void 0||bt.isReady())&&G.delete(Mt)}),G.size===0){V(w);return}setTimeout(gt,10)}me.get("KHR_parallel_shader_compile")!==null?gt():setTimeout(gt,10)})};let or=null;function Vd(w){or&&or(w)}function Dh(){En.stop()}function Ih(){En.start()}const En=new ud;En.setAnimationLoop(Vd),typeof self<"u"&&En.setContext(self),this.setAnimationLoop=function(w){or=w,Et.setAnimationLoop(w),w===null?En.stop():En.start()},Et.addEventListener("sessionstart",Dh),Et.addEventListener("sessionend",Ih),this.render=function(w,U){if(U!==void 0&&U.isCamera!==!0){re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(N===!0)return;k!==null&&k.renderStart(w,U);const X=Et.enabled===!0&&Et.isPresenting===!0,G=E!==null&&(j===null||X)&&E.begin(L,j);if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Et.enabled===!0&&Et.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(Et.cameraAutoUpdate===!0&&Et.updateCamera(U),U=Et.getCamera()),w.isScene===!0&&w.onBeforeRender(L,w,U,j),T=ct.get(w,M.length),T.init(U),T.state.textureUnits=Y.getTextureUnits(),M.push(T),Zt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),qt.setFromProjectionMatrix(Zt,Wi,U.reversedDepth),xe=this.localClippingEnabled,se=Ct.init(this.clippingPlanes,xe),S=pt.get(w,R.length),S.init(),R.push(S),Et.enabled===!0&&Et.isPresenting===!0){const Mt=L.xr.getDepthSensingMesh();Mt!==null&&hr(Mt,U,-1/0,L.sortObjects)}hr(w,U,0,L.sortObjects),S.finish(),k!==null&&k.updateLights(T.state.lightsArray),L.sortObjects===!0&&S.sort(wt,Ot),Te=Et.enabled===!1||Et.isPresenting===!1||Et.hasDepthSensing()===!1,Te&&Gt.addToRenderList(S,w),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),se===!0&&Ct.beginShadows();const V=T.state.shadowsArray;if(zt.render(V,w,U),se===!0&&Ct.endShadows(),(G&&E.hasRenderPass())===!1){const Mt=S.opaque,mt=S.transmissive;if(T.setupLights(),U.isArrayCamera){const bt=U.cameras;if(mt.length>0)for(let At=0,Vt=bt.length;At<Vt;At++){const Yt=bt[At];Uh(Mt,mt,w,Yt)}Te&&Gt.render(w);for(let At=0,Vt=bt.length;At<Vt;At++){const Yt=bt[At];Nh(S,w,Yt,Yt.viewport)}}else mt.length>0&&Uh(Mt,mt,w,U),Te&&Gt.render(w),Nh(S,w,U)}j!==null&&O===0&&(Y.updateMultisampleRenderTarget(j),Y.updateRenderTargetMipmap(j)),G&&E.end(L),w.isScene===!0&&w.onAfterRender(L,w,U),xt.resetDefaultState(),q=-1,tt=null,M.pop(),M.length>0?(T=M[M.length-1],Y.setTextureUnits(T.state.textureUnits),se===!0&&Ct.setGlobalState(L.clippingPlanes,T.state.camera)):T=null,R.pop(),R.length>0?S=R[R.length-1]:S=null,k!==null&&k.renderEnd()};function hr(w,U,X,G){if(w.visible===!1)return;if(w.layers.test(U.layers)){if(w.isGroup)X=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(U);else if(w.isLightProbeGrid)T.pushLightProbeGrid(w);else if(w.isLight)T.pushLight(w),w.castShadow&&T.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||w.intersectsFrustum(qt)){G&&Ge.setFromMatrixPosition(w.matrixWorld).applyMatrix4(Zt);const Mt=Q.update(w),mt=w.material;mt.visible&&S.push(w,Mt,mt,X,Ge.z,null,U)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||w.intersectsFrustum(qt))){const Mt=Q.update(w),mt=w.material;if(G&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Ge.copy(w.boundingSphere.center)):(Mt.boundingSphere===null&&Mt.computeBoundingSphere(),Ge.copy(Mt.boundingSphere.center)),Ge.applyMatrix4(w.matrixWorld).applyMatrix4(Zt)),Array.isArray(mt)){const bt=Mt.groups;for(let At=0,Vt=bt.length;At<Vt;At++){const Yt=bt[At],St=mt[Yt.materialIndex];St&&St.visible&&S.push(w,Mt,St,X,Ge.z,Yt,U)}}else mt.visible&&S.push(w,Mt,mt,X,Ge.z,null,U)}}const gt=w.children;for(let Mt=0,mt=gt.length;Mt<mt;Mt++)hr(gt[Mt],U,X,G)}function Nh(w,U,X,G){const{opaque:V,transmissive:gt,transparent:Mt}=w;T.setupLightsView(X),se===!0&&Ct.setGlobalState(L.clippingPlanes,X),G&&_.viewport(it.copy(G)),V.length>0&&ia(V,U,X),gt.length>0&&ia(gt,U,X),Mt.length>0&&ia(Mt,U,X),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function Uh(w,U,X,G){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[G.id]===void 0){const St=me.has("EXT_color_buffer_half_float")||me.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[G.id]=new ni(1,1,{generateMipmaps:!0,type:St?ci:vi,minFilter:In,samples:Math.max(4,A.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Kt.workingColorSpace})}const gt=T.state.transmissionRenderTarget[G.id],Mt=G.viewport||it;gt.setSize(Mt.z*L.transmissionResolutionScale,Mt.w*L.transmissionResolutionScale);const mt=L.getRenderTarget(),bt=L.getActiveCubeFace(),At=L.getActiveMipmapLevel();L.setRenderTarget(gt),L.getClearColor(ce),Qt=L.getClearAlpha(),Qt<1&&L.setClearColor(16777215,.5),L.clear(),Te&&Gt.render(X);const Vt=L.toneMapping;L.toneMapping=Yi;const Yt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),T.setupLightsView(G),se===!0&&Ct.setGlobalState(L.clippingPlanes,G),ia(w,X,G),Y.updateMultisampleRenderTarget(gt),Y.updateRenderTargetMipmap(gt),me.has("WEBGL_multisampled_render_to_texture")===!1){let St=!1;for(let ue=0,Ne=U.length;ue<Ne;ue++){const Me=U[ue],{object:ve,geometry:$e,material:yt,group:je}=Me;if(yt.side===we&&ve.layers.test(G.layers)){const ee=yt.side;yt.side=ei,yt.needsUpdate=!0,Fh(ve,X,G,$e,yt,je),yt.side=ee,yt.needsUpdate=!0,St=!0}}St===!0&&(Y.updateMultisampleRenderTarget(gt),Y.updateRenderTargetMipmap(gt))}L.setRenderTarget(mt,bt,At),L.setClearColor(ce,Qt),Yt!==void 0&&(G.viewport=Yt),L.toneMapping=Vt}function ia(w,U,X){const G=U.isScene===!0?U.overrideMaterial:null;for(let V=0,gt=w.length;V<gt;V++){const Mt=w[V],{object:mt,geometry:bt,group:At}=Mt;let Vt=Mt.material;Vt.allowOverride===!0&&G!==null&&(Vt=G),mt.layers.test(X.layers)&&Fh(mt,U,X,bt,Vt,At)}}function Fh(w,U,X,G,V,gt){k!==null&&V.isNodeMaterial&&k.setObject(w,V),w.onBeforeRender(L,U,X,G,V,gt),w.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),V.onBeforeRender(L,U,X,G,w,gt),V.transparent===!0&&V.side===we&&V.forceSinglePass===!1?(V.side=ei,V.needsUpdate=!0,L.renderBufferDirect(X,U,G,V,w,gt),V.side=Sn,V.needsUpdate=!0,L.renderBufferDirect(X,U,G,V,w,gt),V.side=we):L.renderBufferDirect(X,U,G,V,w,gt),w.onAfterRender(L,U,X,G,V,gt)}function na(w,U,X){U.isScene!==!0&&(U=ai);const G=W.get(w),V=T.state.lights,gt=T.state.shadowsArray,Mt=V.state.version,mt=lt.getParameters(w,V.state,gt,U,X,T.state.lightProbeGridArray),bt=lt.getProgramCacheKey(mt);let At=G.programs;G.environment=w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial?U.environment:null,G.fog=U.fog;const Vt=w.isMeshStandardMaterial||w.isMeshLambertMaterial&&!w.envMap||w.isMeshPhongMaterial&&!w.envMap;G.envMap=rt.get(w.envMap||G.environment,Vt),G.envMapRotation=G.environment!==null&&w.envMap===null?U.environmentRotation:w.envMapRotation,At===void 0&&(w.addEventListener("dispose",Ni),At=new Map,G.programs=At);let Yt=At.get(bt);if(Yt!==void 0){if(G.currentProgram===Yt&&G.lightsStateVersion===Mt)return Bh(w,mt),Yt}else mt.uniforms=lt.getUniforms(w),k!==null&&w.isNodeMaterial&&k.build(w,X,mt),w.onBeforeCompile(mt,L),Yt=lt.acquireProgram(mt,bt),At.set(bt,Yt),G.uniforms=mt.uniforms;const St=G.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(St.clippingPlanes=Ct.uniform),Bh(w,mt),G.needsLights=Yd(w),G.lightsStateVersion=Mt,G.needsLights&&(St.ambientLightColor.value=V.state.ambient,St.lightProbe.value=V.state.probe,St.sunLights.value=V.state.sun,St.sunLightShadows.value=V.state.sunShadow,St.directionalLights.value=V.state.directional,St.directionalLightShadows.value=V.state.directionalShadow,St.spotLights.value=V.state.spot,St.spotLightShadows.value=V.state.spotShadow,St.rectAreaLights.value=V.state.rectArea,St.ltc_1.value=V.state.rectAreaLTC1,St.ltc_2.value=V.state.rectAreaLTC2,St.pointLights.value=V.state.point,St.pointLightShadows.value=V.state.pointShadow,St.hemisphereLights.value=V.state.hemi,St.sunShadowMatrix.value=V.state.sunShadowMatrix,St.sunShadowCascade.value=V.state.sunShadowCascade,St.directionalShadowMatrix.value=V.state.directionalShadowMatrix,St.spotLightMatrix.value=V.state.spotLightMatrix,St.spotLightMap.value=V.state.spotLightMap,St.pointShadowMatrix.value=V.state.pointShadowMatrix),G.lightProbeGrid=T.state.lightProbeGridArray.length>0,G.currentProgram=Yt,G.uniformsList=null,Yt}function zh(w){if(w.uniformsList===null){const U=w.currentProgram.getUniforms();w.uniformsList=Va.seqWithValue(U.seq,w.uniforms)}return w.uniformsList}function Bh(w,U){const X=W.get(w);X.outputColorSpace=U.outputColorSpace,X.batching=U.batching,X.batchingColor=U.batchingColor,X.instancing=U.instancing,X.instancingColor=U.instancingColor,X.instancingMorph=U.instancingMorph,X.skinning=U.skinning,X.morphTargets=U.morphTargets,X.morphNormals=U.morphNormals,X.morphColors=U.morphColors,X.morphTargetsCount=U.morphTargetsCount,X.numClippingPlanes=U.numClippingPlanes,X.numIntersection=U.numClipIntersection,X.vertexAlphas=U.vertexAlphas,X.vertexTangents=U.vertexTangents,X.toneMapping=U.toneMapping}function Wd(w,U){if(w.length===0)return null;if(w.length===1)return w[0].texture!==null?w[0]:null;x.setFromMatrixPosition(U.matrixWorld);for(let X=0,G=w.length;X<G;X++){const V=w[X];if(V.texture!==null&&V.boundingBox.containsPoint(x))return V}return null}function Xd(w,U,X,G,V){U.isScene!==!0&&(U=ai),Y.resetTextureUnits();const gt=U.fog,Mt=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?U.environment:null,mt=j===null?L.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:Kt.workingColorSpace,bt=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,At=rt.get(G.envMap||Mt,bt),Vt=G.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,Yt=!!X.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),St=!!X.morphAttributes.position,ue=!!X.morphAttributes.normal,Ne=!!X.morphAttributes.color;let Me=Yi;G.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Me=L.toneMapping);const ve=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,$e=ve!==void 0?ve.length:0,yt=W.get(G),je=T.state.lights;if(se===!0&&(xe===!0||w!==tt)){const _e=w===tt&&G.id===q;Ct.setState(G,w,_e)}let ee=!1;G.version===yt.__version?(yt.needsLights&&yt.lightsStateVersion!==je.state.version||yt.outputColorSpace!==mt||V.isBatchedMesh&&yt.batching===!1||!V.isBatchedMesh&&yt.batching===!0||V.isBatchedMesh&&yt.batchingColor===!0&&V._colorsTexture===null||V.isBatchedMesh&&yt.batchingColor===!1&&V._colorsTexture!==null||V.isInstancedMesh&&yt.instancing===!1||!V.isInstancedMesh&&yt.instancing===!0||V.isSkinnedMesh&&yt.skinning===!1||!V.isSkinnedMesh&&yt.skinning===!0||V.isInstancedMesh&&yt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&yt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&yt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&yt.instancingMorph===!1&&V.morphTexture!==null||yt.envMap!==At||G.fog===!0&&yt.fog!==gt||yt.numClippingPlanes!==void 0&&(yt.numClippingPlanes!==Ct.numPlanes||yt.numIntersection!==Ct.numIntersection)||yt.vertexAlphas!==Vt||yt.vertexTangents!==Yt||yt.morphTargets!==St||yt.morphNormals!==ue||yt.morphColors!==Ne||yt.toneMapping!==Me||yt.morphTargetsCount!==$e||!!yt.lightProbeGrid!=T.state.lightProbeGridArray.length>0)&&(ee=!0):(ee=!0,yt.__version=G.version);let _i=yt.currentProgram;ee===!0&&(_i=na(G,U,V),k&&G.isNodeMaterial&&k.onUpdateProgram(G,_i,yt));let Ui=!1,dn=!1,Wn=!1;const ge=_i.getUniforms(),De=yt.uniforms;if(_.useProgram(_i.program)&&(Ui=!0,dn=!0,Wn=!0),G.id!==q&&(q=G.id,dn=!0),yt.needsLights){const _e=Wd(T.state.lightProbeGridArray,V);yt.lightProbeGrid!==_e&&(yt.lightProbeGrid=_e,dn=!0)}if(Ui||tt!==w){_.buffers.depth.getReversed()&&w.reversedDepth!==!0&&(w._reversedDepth=!0,w.updateProjectionMatrix()),ge.setValue(z,"projectionMatrix",w.projectionMatrix),ge.setValue(z,"viewMatrix",w.matrixWorldInverse);const fn=ge.map.cameraPosition;fn!==void 0&&fn.setValue(z,be.setFromMatrixPosition(w.matrixWorld)),A.logarithmicDepthBuffer&&ge.setValue(z,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&ge.setValue(z,"isOrthographic",w.isOrthographicCamera===!0),tt!==w&&(tt=w,dn=!0,Wn=!0)}if(yt.needsLights&&(je.state.sunShadowMap.length>0&&ge.setValue(z,"sunShadowMap",je.state.sunShadowMap,Y),je.state.directionalShadowMap.length>0&&ge.setValue(z,"directionalShadowMap",je.state.directionalShadowMap,Y),je.state.spotShadowMap.length>0&&ge.setValue(z,"spotShadowMap",je.state.spotShadowMap,Y),je.state.pointShadowMap.length>0&&ge.setValue(z,"pointShadowMap",je.state.pointShadowMap,Y)),V.isSkinnedMesh){ge.setOptional(z,V,"bindMatrix"),ge.setOptional(z,V,"bindMatrixInverse");const _e=V.skeleton;_e&&(_e.boneTexture===null&&_e.computeBoneTexture(),ge.setValue(z,"boneTexture",_e.boneTexture,Y))}V.isBatchedMesh&&(ge.setOptional(z,V,"batchingTexture"),ge.setValue(z,"batchingTexture",V._matricesTexture,Y),ge.setOptional(z,V,"batchingIdTexture"),ge.setValue(z,"batchingIdTexture",V._indirectTexture,Y),ge.setOptional(z,V,"batchingColorTexture"),V._colorsTexture!==null&&ge.setValue(z,"batchingColorTexture",V._colorsTexture,Y));const un=X.morphAttributes;if((un.position!==void 0||un.normal!==void 0||un.color!==void 0)&&F.update(V,X,_i),(dn||yt.receiveShadow!==V.receiveShadow)&&(yt.receiveShadow=V.receiveShadow,ge.setValue(z,"receiveShadow",V.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&U.environment!==null&&(De.envMapIntensity.value=U.environmentIntensity),De.dfgLUT!==void 0&&(De.dfgLUT.value=$v()),dn){if(ge.setValue(z,"toneMappingExposure",L.toneMappingExposure),yt.needsLights&&qd(De,Wn),gt&&G.fog===!0&&Rt.refreshFogUniforms(De,gt),Rt.refreshMaterialUniforms(De,G,et,$,T.state.transmissionRenderTarget[w.id]),yt.needsLights&&yt.lightProbeGrid){const _e=yt.lightProbeGrid;De.probesSH.value=_e.texture,De.probesMin.value.copy(_e.boundingBox.min),De.probesMax.value.copy(_e.boundingBox.max),De.probesResolution.value.copy(_e.resolution)}Va.upload(z,zh(yt),De,Y)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Va.upload(z,zh(yt),De,Y),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&ge.setValue(z,"center",V.center),ge.setValue(z,"modelViewMatrix",V.modelViewMatrix),ge.setValue(z,"normalMatrix",V.normalMatrix),ge.setValue(z,"modelMatrix",V.matrixWorld),G.uniformsGroups!==void 0){const _e=G.uniformsGroups;for(let fn=0,Xn=_e.length;fn<Xn;fn++){const Hh=_e[fn];st.update(Hh,_i),st.bind(Hh,_i)}}return _i}function qd(w,U){w.ambientLightColor.needsUpdate=U,w.lightProbe.needsUpdate=U,w.sunLights.needsUpdate=U,w.sunLightShadows.needsUpdate=U,w.directionalLights.needsUpdate=U,w.directionalLightShadows.needsUpdate=U,w.pointLights.needsUpdate=U,w.pointLightShadows.needsUpdate=U,w.spotLights.needsUpdate=U,w.spotLightShadows.needsUpdate=U,w.rectAreaLights.needsUpdate=U,w.hemisphereLights.needsUpdate=U}function Yd(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return B},this.getActiveMipmapLevel=function(){return O},this.getRenderTarget=function(){return j},this.setRenderTargetTextures=function(w,U,X){const G=W.get(w);G.__autoAllocateDepthBuffer=w.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),W.get(w.texture).__webglTexture=U,W.get(w.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:X,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(w,U){const X=W.get(w);X.__webglFramebuffer=U,X.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(w,U=0,X=0){j=w,B=U,O=X;let G=null,V=!1,gt=!1;if(w){const mt=W.get(w);if(mt.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(z.FRAMEBUFFER,mt.__webglFramebuffer),it.copy(w.viewport),It.copy(w.scissor),Tt=w.scissorTest,_.viewport(it),_.scissor(It),_.setScissorTest(Tt),q=-1;return}else if(mt.__webglFramebuffer===void 0)Y.setupRenderTarget(w);else if(mt.__hasExternalTextures)Y.rebindTextures(w,W.get(w.texture).__webglTexture,W.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){const Vt=w.depthTexture;if(mt.__boundDepthTexture!==Vt){if(Vt!==null&&W.has(Vt)&&(w.width!==Vt.image.width||w.height!==Vt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Y.setupDepthRenderbuffer(w)}}const bt=w.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(gt=!0);const At=W.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(At[U])?G=At[U][X]:G=At[U],V=!0):w.samples>0&&Y.useMultisampledRTT(w)===!1?G=W.get(w).__webglMultisampledFramebuffer:Array.isArray(At)?G=At[X]:G=At,it.copy(w.viewport),It.copy(w.scissor),Tt=w.scissorTest}else it.copy(_t).multiplyScalar(et).floor(),It.copy(Xt).multiplyScalar(et).floor(),Tt=Fe;if(X!==0&&(G=D),_.bindFramebuffer(z.FRAMEBUFFER,G)&&_.drawBuffers(w,G),_.viewport(it),_.scissor(It),_.setScissorTest(Tt),V){const mt=W.get(w.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+U,mt.__webglTexture,X)}else if(gt){const mt=U;for(let bt=0;bt<w.textures.length;bt++){const At=W.get(w.textures[bt]);z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+bt,At.__webglTexture,X,mt)}}else if(w!==null&&X!==0){const mt=W.get(w.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,mt.__webglTexture,X)}q=-1};function Oh(w){const U=W.get(w);return(U.__readFormat!==w.format||U.__readType!==w.type)&&(U.__readFormat=w.format,U.__readType=w.type,U.__formatReadable=A.textureFormatReadable(w.format),U.__typeReadable=A.textureTypeReadable(w.type)),U}this.readRenderTargetPixels=function(w,U,X,G,V,gt,Mt,mt=0){if(!(w&&w.isWebGLRenderTarget)){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=W.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Mt!==void 0&&(bt=bt[Mt]),bt){_.bindFramebuffer(z.FRAMEBUFFER,bt);try{const At=w.textures[mt],Vt=At.format,Yt=At.type;w.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+mt);const St=Oh(At);if(St.__formatReadable===!1){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(St.__typeReadable===!1){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=w.width-G&&X>=0&&X<=w.height-V&&z.readPixels(U,X,G,V,ut.convert(Vt),ut.convert(Yt),gt)}finally{const At=j!==null?W.get(j).__webglFramebuffer:null;_.bindFramebuffer(z.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(w,U,X,G,V,gt,Mt,mt=0){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=W.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Mt!==void 0&&(bt=bt[Mt]),bt)if(U>=0&&U<=w.width-G&&X>=0&&X<=w.height-V){_.bindFramebuffer(z.FRAMEBUFFER,bt);const At=w.textures[mt],Vt=At.format,Yt=At.type;w.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+mt);const St=Oh(At);if(St.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(St.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ue=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,ue),z.bufferData(z.PIXEL_PACK_BUFFER,gt.byteLength,z.STREAM_READ),z.readPixels(U,X,G,V,ut.convert(Vt),ut.convert(Yt),0),z.bindBuffer(z.PIXEL_PACK_BUFFER,null);const Ne=j!==null?W.get(j).__webglFramebuffer:null;_.bindFramebuffer(z.FRAMEBUFFER,Ne);const Me=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await Pu(z,Me,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,ue),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,gt),z.bindBuffer(z.PIXEL_PACK_BUFFER,null),z.deleteBuffer(ue),z.deleteSync(Me),gt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(w,U=null,X=0){const G=Math.pow(2,-X),V=Math.floor(w.image.width*G),gt=Math.floor(w.image.height*G),Mt=U!==null?U.x:0,mt=U!==null?U.y:0;Y.setTexture2D(w,0),z.copyTexSubImage2D(z.TEXTURE_2D,X,0,0,Mt,mt,V,gt),_.unbindTexture()},this.copyTextureToTexture=function(w,U,X=null,G=null,V=0,gt=0){let Mt,mt,bt,At,Vt,Yt,St,ue,Ne;const Me=w.isCompressedTexture?w.mipmaps[gt]:w.image;if(X!==null)Mt=X.max.x-X.min.x,mt=X.max.y-X.min.y,bt=X.isBox3?X.max.z-X.min.z:1,At=X.min.x,Vt=X.min.y,Yt=X.isBox3?X.min.z:0;else{const De=Math.pow(2,-V);Mt=Math.floor(Me.width*De),mt=Math.floor(Me.height*De),w.isDataArrayTexture?bt=Me.depth:w.isData3DTexture?bt=Math.floor(Me.depth*De):bt=1,At=0,Vt=0,Yt=0}G!==null?(St=G.x,ue=G.y,Ne=G.z):(St=0,ue=0,Ne=0);const ve=ut.convert(U.format),$e=ut.convert(U.type);let yt;U.isData3DTexture?(Y.setTexture3D(U,0),yt=z.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(Y.setTexture2DArray(U,0),yt=z.TEXTURE_2D_ARRAY):(Y.setTexture2D(U,0),yt=z.TEXTURE_2D),_.activeTexture(z.TEXTURE0),_.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,U.flipY),_.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),_.pixelStorei(z.UNPACK_ALIGNMENT,U.unpackAlignment);const je=_.getParameter(z.UNPACK_ROW_LENGTH),ee=_.getParameter(z.UNPACK_IMAGE_HEIGHT),_i=_.getParameter(z.UNPACK_SKIP_PIXELS),Ui=_.getParameter(z.UNPACK_SKIP_ROWS),dn=_.getParameter(z.UNPACK_SKIP_IMAGES);_.pixelStorei(z.UNPACK_ROW_LENGTH,Me.width),_.pixelStorei(z.UNPACK_IMAGE_HEIGHT,Me.height),_.pixelStorei(z.UNPACK_SKIP_PIXELS,At),_.pixelStorei(z.UNPACK_SKIP_ROWS,Vt),_.pixelStorei(z.UNPACK_SKIP_IMAGES,Yt);const Wn=w.isDataArrayTexture||w.isData3DTexture,ge=U.isDataArrayTexture||U.isData3DTexture;if(w.isDepthTexture){const De=W.get(w),un=W.get(U),_e=W.get(De.__renderTarget),fn=W.get(un.__renderTarget);_.bindFramebuffer(z.READ_FRAMEBUFFER,_e.__webglFramebuffer),_.bindFramebuffer(z.DRAW_FRAMEBUFFER,fn.__webglFramebuffer);for(let Xn=0;Xn<bt;Xn++)Wn&&(z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,W.get(w).__webglTexture,V,Yt+Xn),z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,W.get(U).__webglTexture,gt,Ne+Xn)),z.blitFramebuffer(At,Vt,Mt,mt,St,ue,Mt,mt,z.DEPTH_BUFFER_BIT,z.NEAREST);_.bindFramebuffer(z.READ_FRAMEBUFFER,null),_.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else if(V!==0||w.isRenderTargetTexture||W.has(w)){const De=W.get(w),un=W.get(U);_.bindFramebuffer(z.READ_FRAMEBUFFER,I),_.bindFramebuffer(z.DRAW_FRAMEBUFFER,P);for(let _e=0;_e<bt;_e++)Wn?z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,De.__webglTexture,V,Yt+_e):z.framebufferTexture2D(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,De.__webglTexture,V),ge?z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,un.__webglTexture,gt,Ne+_e):z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,un.__webglTexture,gt),V!==0?z.blitFramebuffer(At,Vt,Mt,mt,St,ue,Mt,mt,z.COLOR_BUFFER_BIT,z.NEAREST):ge?z.copyTexSubImage3D(yt,gt,St,ue,Ne+_e,At,Vt,Mt,mt):z.copyTexSubImage2D(yt,gt,St,ue,At,Vt,Mt,mt);_.bindFramebuffer(z.READ_FRAMEBUFFER,null),_.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else ge?w.isDataTexture||w.isData3DTexture?z.texSubImage3D(yt,gt,St,ue,Ne,Mt,mt,bt,ve,$e,Me.data):U.isCompressedArrayTexture?z.compressedTexSubImage3D(yt,gt,St,ue,Ne,Mt,mt,bt,ve,Me.data):z.texSubImage3D(yt,gt,St,ue,Ne,Mt,mt,bt,ve,$e,Me):w.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,gt,St,ue,Mt,mt,ve,$e,Me.data):w.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,gt,St,ue,Me.width,Me.height,ve,Me.data):z.texSubImage2D(z.TEXTURE_2D,gt,St,ue,Mt,mt,ve,$e,Me);_.pixelStorei(z.UNPACK_ROW_LENGTH,je),_.pixelStorei(z.UNPACK_IMAGE_HEIGHT,ee),_.pixelStorei(z.UNPACK_SKIP_PIXELS,_i),_.pixelStorei(z.UNPACK_SKIP_ROWS,Ui),_.pixelStorei(z.UNPACK_SKIP_IMAGES,dn),gt===0&&U.generateMipmaps&&z.generateMipmap(yt),_.unbindTexture()},this.initRenderTarget=function(w){W.get(w).__webglFramebuffer===void 0&&Y.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?Y.setTextureCube(w,0):w.isData3DTexture?Y.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?Y.setTexture2DArray(w,0):Y.setTexture2D(w,0),_.unbindTexture()},this.resetState=function(){B=0,O=0,j=null,_.reset(),xt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Wi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Kt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Kt._getUnpackColorSpace()}}const Wa={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class Ms{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Kv=new sr(-1,1,1,-1,0,1);class Jv extends Se{constructor(){super(),this.setAttribute("position",new Jt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Jt([0,2,0,0,2,0],2))}}const Qv=new Jv;class Sh{constructor(t){this._mesh=new J(Qv,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Kv)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class jv extends Ms{constructor(t,e="tDiffuse"){super(),this.textureID=e,this.uniforms=null,this.material=null,t instanceof Be?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=ps.clone(t.uniforms),this.material=new Be({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new Sh(this.material)}render(t,e,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Zl extends Ms{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,i){const n=t.getContext(),s=t.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let r,o;this.inverse?(r=0,o=1):(r=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(n.REPLACE,n.REPLACE,n.REPLACE),s.buffers.stencil.setFunc(n.ALWAYS,r,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),t.setRenderTarget(i),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(n.EQUAL,1,4294967295),s.buffers.stencil.setOp(n.KEEP,n.KEEP,n.KEEP),s.buffers.stencil.setLocked(!0)}}class tx extends Ms{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class ex{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const i=t.getSize(new ht);this._width=i.width,this._height=i.height,e=new ni(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:ci}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new jv(Wa),this.copyPass.material.blending=qi,this.timer=new Kf}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){this.timer.update(),t===void 0&&(t=this.timer.getDelta());const e=this.renderer.getRenderTarget();let i=!1;for(let n=0,s=this.passes.length;n<s;n++){const r=this.passes[n];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(n),r.render(this.renderer,this.writeBuffer,this.readBuffer,t,i),r.needsSwap){if(i){const o=this.renderer.getContext(),h=this.renderer.state.buffers.stencil;h.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),h.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Zl!==void 0&&(r instanceof Zl?i=!0:r instanceof tx&&(i=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new ht);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const i=this._width*this._pixelRatio,n=this._height*this._pixelRatio;this.renderTarget1.setSize(i,n),this.renderTarget2.setSize(i,n);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,n)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class ix extends Ms{constructor(t,e,i=null,n=null,s=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=i,this.clearColor=n,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Nt}render(t,e,i){const n=t.autoClear;t.autoClear=!1;let s,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(s=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),t.autoClear=n}}const nx={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Nt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class ms extends Ms{constructor(t,e=1,i,n){super(),this.strength=e,this.radius=i,this.threshold=n,this.resolution=t!==void 0?new ht(t.x,t.y):new ht(256,256),this.clearColor=new Nt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new ni(s,r,{type:ci,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let c=0;c<this.nMips;c++){const u=new ni(s,r,{type:ci,depthBuffer:!1});u.texture.name="UnrealBloomPass.h"+c,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const d=new ni(s,r,{type:ci,depthBuffer:!1});d.texture.name="UnrealBloomPass.v"+c,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),s=Math.round(s/2),r=Math.round(r/2)}const o=nx;this.highPassUniforms=ps.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=n,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Be({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const h=[6,10,14,18,22];s=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let c=0;c<this.nMips;c++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(h[c])),this.separableBlurMaterials[c].uniforms.invSize.value=new ht(1/s,1/r),s=Math.round(s/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=ps.clone(Wa.uniforms),this.blendMaterial=new Be({uniforms:this.copyUniforms,vertexShader:Wa.vertexShader,fragmentShader:Wa.fragmentShader,premultipliedAlpha:!0,blending:xi,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Nt,this._oldClearAlpha=1,this._basic=new si,this._fsQuad=new Sh(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,e){let i=Math.round(t/2),n=Math.round(e/2);this.renderTargetBright.setSize(i,n);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(i,n),this.renderTargetsVertical[s].setSize(i,n),this.separableBlurMaterials[s].uniforms.invSize.value=new ht(1/i,1/n),i=Math.round(i/2),n=Math.round(n/2)}render(t,e,i,n,s){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();const r=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),s&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let o=this.renderTargetBright;for(let h=0;h<this.nMips;h++)this._fsQuad.material=this.separableBlurMaterials[h],this.separableBlurMaterials[h].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[h].uniforms.direction.value=ms.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[h]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[h].uniforms.colorTexture.value=this.renderTargetsHorizontal[h].texture,this.separableBlurMaterials[h].uniforms.direction.value=ms.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[h]),t.clear(),this._fsQuad.render(t),o=this.renderTargetsVertical[h];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(i),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=r}_getSeparableBlurMaterial(t){const e=[],i=t/3;for(let r=0;r<t;r++)e.push(.39894*Math.exp(-.5*r*r/(i*i))/i);const n=[],s=[];for(let r=1;r<t;r+=2){const o=e[r],h=r+1<t?e[r+1]:0,l=o+h;n.push((r*o+(r+1)*h)/l),s.push(l)}return new Be({defines:{KERNEL_PAIRS:n.length},uniforms:{colorTexture:{value:null},invSize:{value:new ht(.5,.5)},direction:{value:new ht(.5,.5)},centerWeight:{value:e[0]},gaussianOffsets:{value:n},gaussianWeights:{value:s}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(t){return new Be({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}ms.BlurDirectionX=new ht(1,0);ms.BlurDirectionY=new ht(0,1);const ka={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class sx extends Ms{constructor(){super(),this.isOutputPass=!0,this.uniforms=ps.clone(ka.uniforms),this.material=new hd({name:ka.name,uniforms:this.uniforms,vertexShader:ka.vertexShader,fragmentShader:ka.fragmentShader}),this._fsQuad=new Sh(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},Kt.getTransfer(this._outputColorSpace)===fe&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ih?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===nh?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===sh?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===er?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===rh?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===oh?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===ah&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const ax=`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`,rx=`
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uStars;
uniform float uMoons;
uniform float uTime;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0
    ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
    : mix(uHorizon, uBottom, pow(clamp(-h, 0.0, 1.0), 0.4));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 3.0 + pow(sd, 18.0) * 0.28 + pow(sd, 3.0) * 0.08);
  if (uStars > 0.0 && h > 0.0) {
    vec3 cell = floor(d * 220.0);
    float s = hash(cell);
    float tw = 0.6 + 0.4 * sin(uTime * 2.0 + s * 40.0);
    col += vec3(step(0.9965, s) * uStars * tw * smoothstep(0.0, 0.25, h));
  }
  if (uMoons > 0.0) {
    vec3 m1 = normalize(vec3(-0.45, 0.42, -0.78));
    vec3 m2 = normalize(vec3(-0.30, 0.50, -0.81));
    float a = smoothstep(0.9992, 0.9995, dot(d, m1));
    float b = smoothstep(0.99955, 0.9998, dot(d, m2));
    col = mix(col, vec3(0.95, 0.9, 1.0), a);
    col = mix(col, vec3(0.75, 0.55, 1.0), b);
    col += vec3(0.4, 0.3, 0.6) * pow(max(dot(d, m1), 0.0), 60.0) * 0.5 * uMoons;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;class ox{mesh;uniforms;constructor(){this.uniforms={uTop:{value:new Nt},uHorizon:{value:new Nt},uBottom:{value:new Nt},uSunDir:{value:new C(0,1,0)},uSunColor:{value:new Nt},uStars:{value:0},uMoons:{value:0},uTime:{value:0}};const t=new Be({uniforms:this.uniforms,vertexShader:ax,fragmentShader:rx,side:ei,depthWrite:!1,fog:!1});this.mesh=new J(new wi(900,32,16),t),this.mesh.frustumCulled=!1,this.mesh.renderOrder=-1e3}apply(t){this.uniforms.uTop.value.setHex(t.top),this.uniforms.uHorizon.value.setHex(t.horizon),this.uniforms.uBottom.value.setHex(t.bottom),this.uniforms.uSunDir.value.set(...t.sunDir).normalize(),this.uniforms.uSunColor.value.setHex(t.sunColor),this.uniforms.uStars.value=t.stars??0,this.uniforms.uMoons.value=t.moons?1:0}update(t,e){this.mesh.position.copy(t),this.uniforms.uTime.value=e}}class hx{gl;scene=new qu;camera;sun;hemi;sky=new ox;canvas;composer=null;bloom=null;quality="high";sunOffset=new C(30,50,20);constructor(t){this.gl=new Zv({antialias:!0,powerPreference:"high-performance"}),this.gl.outputColorSpace=mi,this.gl.toneMapping=er,this.gl.toneMappingExposure=1.2,this.gl.shadowMap.enabled=!0,this.gl.shadowMap.type=Bs,this.canvas=this.gl.domElement,this.canvas.id="game",t.appendChild(this.canvas),this.camera=new gi(60,16/9,.1,1200),this.scene.add(this.camera),this.hemi=new Vf(12572927,4864554,1),this.scene.add(this.hemi),this.sun=new Yf(16773336,2.2),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048);const e=this.sun.shadow.camera;e.left=-40,e.right=40,e.top=40,e.bottom=-40,e.near=1,e.far=160,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.03,this.scene.add(this.sun),this.scene.add(this.sun.target),this.scene.add(this.sky.mesh),this.setQuality("high"),this.resize(),window.addEventListener("resize",()=>this.resize())}setQuality(t){this.quality=t;const e=Math.min(window.devicePixelRatio||1,t==="high"?2:t==="medium"?1.25:1);this.gl.setPixelRatio(e),this.gl.shadowMap.enabled=t!=="low",this.sun.castShadow=t!=="low";const i=t==="high"?2048:1024;this.sun.shadow.mapSize.x!==i&&(this.sun.shadow.mapSize.set(i,i),this.sun.shadow.map?.dispose(),this.sun.shadow.map=null),t==="high"?this.composer||(this.composer=new ex(this.gl),this.composer.addPass(new ix(this.scene,this.camera)),this.bloom=new ms(new ht(512,512),.55,.5,.82),this.composer.addPass(this.bloom),this.composer.addPass(new sx)):this.composer&&(this.composer.dispose(),this.composer=null,this.bloom=null),this.resize()}resize(){const t=window.innerWidth,e=window.innerHeight;this.gl.setSize(t,e),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.composer&&(this.composer.setPixelRatio(this.gl.getPixelRatio()),this.composer.setSize(t,e))}get height(){return this.gl.domElement.height}applySky(t){this.sky.apply(t);const e=new Nt(t.fog??t.horizon);this.scene.fog=new xh(e,t.fogNear,t.fogFar),this.scene.background=e,this.sun.color.setHex(t.sunColor),this.sun.intensity=t.sunIntensity,this.hemi.color.setHex(t.hemiSky),this.hemi.groundColor.setHex(t.hemiGround),this.hemi.intensity=t.hemiIntensity,this.sunOffset.set(...t.sunDir).normalize().multiplyScalar(70)}follow(t){const e=80/this.sun.shadow.mapSize.x,i=Math.round(t.x/e)*e,n=Math.round(t.z/e)*e;this.sun.target.position.set(i,t.y,n),this.sun.position.set(i+this.sunOffset.x,t.y+this.sunOffset.y,n+this.sunOffset.z)}render(t){this.sky.update(this.camera.position,t),this.composer?this.composer.render():this.gl.render(this.scene,this.camera)}}const qr={Space:["jump","confirm"],KeyE:["tail"],KeyQ:["burst"],KeyX:["fury"],ShiftLeft:["dodge"],ShiftRight:["dodge"],KeyC:["dragonTime"],KeyF:["interact"],Tab:["lock"],Escape:["pause","back"],KeyP:["pause"],Digit1:["elem1"],Digit2:["elem2"],Digit3:["elem3"],Digit4:["elem4"],Enter:["confirm"],NumpadEnter:["confirm"],ArrowUp:["up"],ArrowDown:["down"],ArrowLeft:["left"],ArrowRight:["right"],KeyW:["up"],KeyS:["down"],KeyA:["left"],KeyD:["right"],KeyJ:["horn"],KeyK:["breath"],KeyL:["tail"],KeyU:["burst"],KeyI:["lock"],KeyR:["elemNext"]},Yr={0:"horn",1:"lock",2:"breath"},$r={0:["jump","confirm"],1:["dodge","back"],2:["horn"],3:["tail"],4:["burst"],5:["lock"],6:["dragonTime"],7:["breath"],8:["fury"],9:["pause"],10:["interact"],11:["lock"],12:["elem1","up"],13:["elem3","down"],14:["elem4","left"],15:["elem2","right"]};class lx{time=0;moveX=0;moveY=0;lookX=0;lookY=0;wheel=0;usingPad=!1;mouseSensitivity=1;invertY=!1;forceMove=null;wantPointerLock=!1;held=new Set;keysDown=new Set;mouseDown=new Set;padDown=new Set;pressAt=new Map;consumedAt=new Map;pressedThisFrame=new Set;releasedThisFrame=new Set;pendingPress=new Set;pendingRelease=new Set;mouseDX=0;mouseDY=0;wheelAcc=0;canvas;constructor(t){this.canvas=t,window.addEventListener("keydown",e=>{if((e.code==="Tab"||e.code==="Space"||e.code.startsWith("Arrow"))&&e.preventDefault(),!e.repeat){this.keysDown.add(e.code);for(const i of qr[e.code]??[])this.pendingPress.add(i);this.usingPad=!1}}),window.addEventListener("keyup",e=>{this.keysDown.delete(e.code);for(const i of qr[e.code]??[])this.pendingRelease.add(i)}),window.addEventListener("blur",()=>{for(const e of this.held)this.pendingRelease.add(e);this.keysDown.clear(),this.mouseDown.clear()}),t.addEventListener("mousedown",e=>{if(this.wantPointerLock&&document.pointerLockElement!==t){this.requestLock();return}this.mouseDown.add(e.button);const i=Yr[e.button];i&&this.pendingPress.add(i),this.usingPad=!1}),window.addEventListener("mouseup",e=>{this.mouseDown.delete(e.button);const i=Yr[e.button];i&&this.pendingRelease.add(i)}),t.addEventListener("contextmenu",e=>e.preventDefault()),window.addEventListener("mousemove",e=>{document.pointerLockElement===t&&(this.mouseDX+=e.movementX,this.mouseDY+=e.movementY)}),window.addEventListener("wheel",e=>{document.pointerLockElement===t&&(this.wheelAcc+=Math.sign(e.deltaY))},{passive:!0})}requestLock(){const t=this.canvas;try{const e=t.requestPointerLock?.();e&&typeof e.catch=="function"&&e.catch(()=>{})}catch{}}releaseLock(){document.pointerLockElement&&document.exitPointerLock()}get locked(){return document.pointerLockElement===this.canvas}update(t){this.time+=t,this.pressedThisFrame.clear(),this.releasedThisFrame.clear();const e=this.pollPad();for(const o of this.pendingPress)this.held.has(o)||(this.held.add(o),this.pressedThisFrame.add(o),this.pressAt.set(o,this.time));this.pendingPress.clear();for(const o of this.pendingRelease)this.stillHeldBySomething(o)||(this.held.delete(o),this.releasedThisFrame.add(o));this.pendingRelease.clear();let i=0,n=0;(this.keysDown.has("KeyA")||this.keysDown.has("ArrowLeft"))&&(i-=1),(this.keysDown.has("KeyD")||this.keysDown.has("ArrowRight"))&&(i+=1),(this.keysDown.has("KeyW")||this.keysDown.has("ArrowUp"))&&(n+=1),(this.keysDown.has("KeyS")||this.keysDown.has("ArrowDown"))&&(n-=1),e&&(Math.abs(e.lx)>0||Math.abs(e.ly)>0)&&(i=e.lx,n=-e.ly),this.forceMove&&(i=this.forceMove.x,n=this.forceMove.y);const s=Math.hypot(i,n);s>1&&(i/=s,n/=s),this.moveX=i,this.moveY=n;const r=.0024*this.mouseSensitivity;if(this.lookX=this.mouseDX*r,this.lookY=this.mouseDY*r*(this.invertY?-1:1),e){const o=2.6*t*this.mouseSensitivity;this.lookX+=e.rx*o,this.lookY+=e.ry*o*(this.invertY?-1:1)}this.mouseDX=0,this.mouseDY=0,this.wheel=this.wheelAcc,this.wheelAcc=0}stillHeldBySomething(t){for(const e of this.keysDown)if(qr[e]?.includes(t))return!0;for(const e of this.mouseDown)if(Yr[e]===t)return!0;for(const e of this.padDown)if($r[e]?.includes(t))return!0;return!1}pollPad(){const t=typeof navigator.getGamepads=="function"?navigator.getGamepads():[];let e=null;for(const r of t)if(r&&r.connected){e=r;break}if(!e)return null;const i=r=>Math.abs(r)<.18?0:(r-Math.sign(r)*.18)/.82,n=new Set;e.buttons.forEach((r,o)=>{(r.pressed||r.value>.5)&&n.add(o)});for(const r of n)if(!this.padDown.has(r)){for(const o of $r[r]??[])this.pendingPress.add(o);this.usingPad=!0}for(const r of this.padDown)if(!n.has(r))for(const o of $r[r]??[])this.pendingRelease.add(o);this.padDown=n;const s={lx:i(e.axes[0]??0),ly:i(e.axes[1]??0),rx:i(e.axes[2]??0),ry:i(e.axes[3]??0)};return(s.lx||s.ly||s.rx||s.ry)&&(this.usingPad=!0),s}down(t){return this.held.has(t)}pressed(t){return this.pressedThisFrame.has(t)}released(t){return this.releasedThisFrame.has(t)}heldFor(t){return this.held.has(t)?this.time-(this.pressAt.get(t)??this.time):0}buffered(t,e=.15){const i=this.pressAt.get(t);if(i===void 0||this.time-i>e)return!1;const n=this.consumedAt.get(t);return n===void 0||n<i}consume(t){this.consumedAt.set(t,this.time)}take(t,e=.15){return this.buffered(t,e)?(this.consume(t),!0):!1}clearBuffers(){this.pressAt.clear(),this.consumedAt.clear()}simulate(t,e){e?this.pendingPress.add(t):this.pendingRelease.add(t)}}const cx=220,Ci=a=>cx*Math.pow(2,a/12);class dx{ctx=null;master;sfxBus;musicBus;exploreBus;combatBus;noiseBuf;loops=new Map;volume=.8;musicVolume=.55;sfxVolume=.9;theme=null;nextNoteTime=0;step=0;schedTimer=null;combat=0;lastPlayed=new Map;unlock(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}const t=window.AudioContext??window.webkitAudioContext;if(!t)return;this.ctx=new t;const e=this.ctx;this.master=e.createGain(),this.master.gain.value=this.volume;const i=e.createDynamicsCompressor();i.threshold.value=-14,i.ratio.value=4,this.master.connect(i).connect(e.destination),this.sfxBus=e.createGain(),this.sfxBus.gain.value=this.sfxVolume,this.sfxBus.connect(this.master),this.musicBus=e.createGain(),this.musicBus.gain.value=this.musicVolume,this.musicBus.connect(this.master),this.exploreBus=e.createGain(),this.exploreBus.connect(this.musicBus),this.combatBus=e.createGain(),this.combatBus.gain.value=0,this.combatBus.connect(this.musicBus);const n=e.sampleRate*2;this.noiseBuf=e.createBuffer(1,n,e.sampleRate);const s=this.noiseBuf.getChannelData(0);for(let r=0;r<n;r++)s[r]=Math.random()*2-1;this.theme&&this.startScheduler()}applyVolumes(){this.ctx&&(this.master.gain.value=this.volume,this.sfxBus.gain.value=this.sfxVolume,this.musicBus.gain.value=this.musicVolume)}tone(t,e,i,n,s={}){const r=this.ctx;if(!r)return;const o=r.currentTime+(s.delay??0),h=r.createOscillator();h.type=i,h.frequency.setValueAtTime(t,o),s.detune&&(h.detune.value=s.detune),s.slide&&h.frequency.exponentialRampToValueAtTime(Math.max(20,s.slide),o+e);const l=r.createGain(),c=s.attack??.005;l.gain.setValueAtTime(1e-4,o),l.gain.exponentialRampToValueAtTime(n,o+c),l.gain.exponentialRampToValueAtTime(1e-4,o+e);let u=h;if(s.filter){const d=r.createBiquadFilter();d.type="lowpass",d.frequency.value=s.filter,d.Q.value=s.q??.7,h.connect(d),u=d}u.connect(l).connect(s.bus??this.sfxBus),h.start(o),h.stop(o+e+.05)}noise(t,e,i={}){const n=this.ctx;if(!n)return;const s=n.currentTime+(i.delay??0),r=n.createBufferSource();r.buffer=this.noiseBuf,r.loop=!0;const o=n.createBiquadFilter();o.type=i.type??"bandpass",o.frequency.setValueAtTime(i.freq??1e3,s),i.freqEnd&&o.frequency.exponentialRampToValueAtTime(i.freqEnd,s+t),o.Q.value=i.q??1;const h=n.createGain(),l=i.attack??.005;h.gain.setValueAtTime(1e-4,s),h.gain.exponentialRampToValueAtTime(e,s+l),h.gain.exponentialRampToValueAtTime(1e-4,s+t),r.connect(o).connect(h).connect(i.bus??this.sfxBus),r.start(s,Math.random()*1.5),r.stop(s+t+.05)}play(t,e=1,i=1){if(!this.ctx)return;const n=this.ctx.currentTime,s=this.lastPlayed.get(t)??-1,r=t.startsWith("gem")?.03:.04;if(n-s<r)return;this.lastPlayed.set(t,n);const o=e,h=i;switch(t){case"swing":this.noise(.14,.28*h,{type:"bandpass",freq:900*o,freqEnd:2600*o,q:1.4,attack:.02});break;case"swingHeavy":this.noise(.24,.35*h,{type:"bandpass",freq:400*o,freqEnd:1400*o,q:1.2,attack:.03});break;case"hit":this.tone(180*o,.12,"sine",.5*h,{slide:70}),this.noise(.08,.35*h,{type:"highpass",freq:1800*o});break;case"hitHeavy":this.tone(120*o,.25,"sine",.7*h,{slide:40}),this.noise(.18,.45*h,{type:"lowpass",freq:1400*o,freqEnd:300}),this.tone(90*o,.2,"square",.12*h,{slide:45,filter:600});break;case"counter":this.tone(660*o,.3,"triangle",.3*h,{slide:1320}),this.tone(140,.3,"sine",.6*h,{slide:40}),this.noise(.25,.4*h,{type:"highpass",freq:2500});break;case"launch":this.tone(200*o,.25,"sine",.5*h,{slide:520}),this.noise(.2,.3*h,{type:"bandpass",freq:500,freqEnd:2500,q:1.2});break;case"jump":this.noise(.12,.12*h,{type:"bandpass",freq:700,freqEnd:1600});break;case"flap":this.noise(.2,.25*h,{type:"lowpass",freq:900,freqEnd:300,attack:.03}),this.tone(95,.15,"sine",.2*h,{slide:60});break;case"land":this.tone(90,.1,"sine",.3*h,{slide:50}),this.noise(.08,.12*h,{type:"lowpass",freq:600});break;case"dodge":this.noise(.18,.25*h,{type:"bandpass",freq:1500,freqEnd:500,q:.8,attack:.01});break;case"perfect":this.tone(880,.5,"sine",.25*h,{slide:1760,attack:.01}),this.tone(1320,.6,"triangle",.18*h,{delay:.05}),this.noise(.4,.15*h,{type:"highpass",freq:5e3,freqEnd:9e3});break;case"gem":case"gemBlue":this.tone(1318*o,.18,"sine",.2*h),this.tone(1975*o,.2,"sine",.12*h,{delay:.04});break;case"gemRed":this.tone(988*o,.2,"sine",.2*h),this.tone(1318*o,.22,"triangle",.1*h,{delay:.05});break;case"gemGreen":this.tone(1175*o,.2,"sine",.2*h),this.tone(1568*o,.2,"sine",.1*h,{delay:.05});break;case"gemPurple":this.tone(740*o,.3,"triangle",.2*h,{slide:1480});break;case"shard":[0,4,7,12].forEach((l,c)=>this.tone(Ci(24+l),.5,"triangle",.2,{delay:c*.07}));break;case"relic":[0,3,7,10,14].forEach((l,c)=>this.tone(Ci(12+l),.9,"sine",.18,{delay:c*.1,attack:.02}));break;case"crystalBreak":this.noise(.3,.35*h,{type:"highpass",freq:3e3});for(let l=0;l<4;l++)this.tone(1800+Math.random()*2400,.25,"sine",.08,{delay:l*.03});break;case"fireBurst":this.noise(.5,.5*h,{type:"lowpass",freq:1800,freqEnd:200,attack:.02}),this.tone(70,.4,"sawtooth",.15*h,{slide:40,filter:400});break;case"zap":this.tone(1200*o,.12,"sawtooth",.12*h,{slide:300,filter:4e3}),this.noise(.1,.25*h,{type:"highpass",freq:3500});break;case"iceCrack":this.noise(.15,.3*h,{type:"highpass",freq:4e3}),this.tone(2400*o,.2,"sine",.1*h,{slide:1800});break;case"shatter":this.noise(.5,.45*h,{type:"highpass",freq:2500,freqEnd:6e3});for(let l=0;l<6;l++)this.tone(2e3+Math.random()*3e3,.3,"sine",.07,{delay:l*.025});this.tone(160,.3,"sine",.4,{slide:50});break;case"rumble":this.noise(.6,.5*h,{type:"lowpass",freq:300,freqEnd:80,attack:.02}),this.tone(55,.5,"sine",.5*h,{slide:35});break;case"explosion":this.noise(.8,.7*h,{type:"lowpass",freq:2500,freqEnd:90}),this.tone(80,.6,"sine",.7*h,{slide:30});break;case"steam":this.noise(.7,.4*h,{type:"highpass",freq:2e3,freqEnd:800,attack:.02});break;case"pound":this.tone(70,.4,"sine",.8*h,{slide:30}),this.noise(.35,.5*h,{type:"lowpass",freq:900,freqEnd:100});break;case"charge":this.noise(.3,.3*h,{type:"bandpass",freq:300,freqEnd:900,q:2,attack:.05});break;case"enemyAlert":this.tone(300*o,.2,"square",.1*h,{slide:520,filter:1500});break;case"enemyAttack":this.tone(220*o,.25,"sawtooth",.12*h,{slide:140,filter:1200});break;case"enemyHurt":this.tone(420*o,.12,"square",.08*h,{slide:250,filter:1800});break;case"enemyDie":this.tone(300*o,.5,"sawtooth",.12*h,{slide:60,filter:1200}),this.noise(.5,.25*h,{type:"bandpass",freq:600,freqEnd:200});break;case"shieldBlock":this.tone(900*o,.2,"square",.12*h,{slide:700,filter:3e3}),this.tone(1350*o,.25,"triangle",.1*h),this.noise(.06,.25*h,{type:"highpass",freq:3e3});break;case"bossRoar":this.tone(90*o,1.2,"sawtooth",.35*h,{slide:55,filter:700,attack:.1}),this.tone(93*o,1.2,"sawtooth",.3*h,{slide:50,filter:500,attack:.1}),this.noise(1.1,.35*h,{type:"bandpass",freq:400,freqEnd:200,q:1.5,attack:.1});break;case"hurt":this.tone(330,.2,"triangle",.3*h,{slide:180}),this.noise(.1,.2*h,{type:"lowpass",freq:1500});break;case"death":[0,-3,-7,-12].forEach((l,c)=>this.tone(Ci(12+l),.5,"triangle",.2,{delay:c*.15}));break;case"ui":this.tone(880,.06,"triangle",.12*h);break;case"uiConfirm":this.tone(660,.08,"triangle",.14*h),this.tone(990,.12,"triangle",.14*h,{delay:.06});break;case"uiBack":this.tone(660,.08,"triangle",.12*h),this.tone(440,.12,"triangle",.12*h,{delay:.06});break;case"checkpoint":[0,7,12,16].forEach((l,c)=>this.tone(Ci(12+l),.6,"sine",.16,{delay:c*.08}));break;case"levelUp":case"unlock":[0,4,7,12,16,19].forEach((l,c)=>this.tone(Ci(12+l),.7,"triangle",.15,{delay:c*.07}));break;case"fury":this.tone(55,2,"sawtooth",.3,{slide:220,filter:1500,attack:.3}),this.noise(2,.4,{type:"bandpass",freq:200,freqEnd:3e3,q:.8,attack:.5});break;case"dragonTimeOn":this.tone(440,.5,"sine",.2,{slide:110}),this.noise(.5,.15,{type:"lowpass",freq:3e3,freqEnd:300});break;case"dragonTimeOff":this.tone(110,.3,"sine",.2,{slide:440});break;case"door":this.noise(1,.35,{type:"lowpass",freq:400,freqEnd:120,attack:.1}),this.tone(60,.9,"sine",.3,{slide:45,attack:.1});break;case"torch":this.noise(.4,.35,{type:"lowpass",freq:2500,freqEnd:600,attack:.02}),this.tone(330,.3,"triangle",.1,{slide:660});break;case"switch":this.tone(520,.1,"square",.1,{filter:2e3}),this.tone(780,.14,"square",.1,{delay:.08,filter:2e3});break;case"splash":this.noise(.5,.4,{type:"lowpass",freq:1800,freqEnd:300});break;case"talk":this.tone(500+Math.random()*200,.04,"triangle",.05*h);break}}startLoop(t,e){const i=this.ctx;if(!i)return;this.stopLoop(t);const n=i.createBufferSource();n.buffer=this.noiseBuf,n.loop=!0;const s=i.createBiquadFilter(),r=i.createGain();r.gain.value=1e-4;let o;switch(e){case"fire":s.type="lowpass",s.frequency.value=1300,r.gain.setTargetAtTime(.35,i.currentTime,.05);break;case"lightning":s.type="highpass",s.frequency.value=2500,r.gain.setTargetAtTime(.18,i.currentTime,.03),o=i.createOscillator(),o.type="sawtooth",o.frequency.value=110;break;case"ice":s.type="bandpass",s.frequency.value=5200,s.Q.value=2,r.gain.setTargetAtTime(.28,i.currentTime,.05);break;case"earth":s.type="lowpass",s.frequency.value=420,r.gain.setTargetAtTime(.5,i.currentTime,.05);break;case"wind":s.type="bandpass",s.frequency.value=600,s.Q.value=.6,r.gain.setTargetAtTime(.14,i.currentTime,.2);break;case"charge":s.type="bandpass",s.frequency.value=350,s.Q.value=1.5,r.gain.setTargetAtTime(.22,i.currentTime,.1);break}if(n.connect(s).connect(r).connect(this.sfxBus),o){const h=i.createGain();h.gain.value=.06,o.connect(h).connect(r),o.start()}n.start(0,Math.random()),this.loops.set(t,{src:n,gain:r,filter:s,...o?{extra:o}:{}})}startLoopOnce(t,e){this.loops.has(t)||this.startLoop(t,e)}tuneLoop(t,e,i){const n=this.loops.get(t);!n||!this.ctx||(n.filter.frequency.setTargetAtTime(e,this.ctx.currentTime,.1),n.gain.gain.setTargetAtTime(i,this.ctx.currentTime,.1))}stopLoop(t){const e=this.loops.get(t);if(!e||!this.ctx)return;const i=this.ctx.currentTime;e.gain.gain.setTargetAtTime(1e-4,i,.05),e.src.stop(i+.3),e.extra?.stop(i+.3),this.loops.delete(t)}stopAllLoops(){for(const t of[...this.loops.keys()])this.stopLoop(t)}setMusic(t){this.theme=t,this.step=0,this.ctx&&t&&this.startScheduler()}setCombat(t){this.combat=t,this.ctx&&(this.combatBus.gain.setTargetAtTime(t*.9,this.ctx.currentTime,.8),this.exploreBus.gain.setTargetAtTime(1-t*.35,this.ctx.currentTime,.8))}startScheduler(){this.ctx&&(this.nextNoteTime=this.ctx.currentTime+.1,this.schedTimer===null&&(this.schedTimer=window.setInterval(()=>this.schedule(),50)))}schedule(){const t=this.ctx,e=this.theme;if(!t||!e)return;const i=60/e.bpm/4;for(;this.nextNoteTime<t.currentTime+.2;)this.playStep(e,this.step,this.nextNoteTime,i),this.nextNoteTime+=i,this.step++}playStep(t,e,i,n){const s=this.ctx,r=Math.floor(e/16)%t.chords.length,o=e%16,h=t.chords[r],l=i-s.currentTime;if(l<-.05)return;const c=Math.max(0,l);if(o===0){for(const d of h)this.tone(Ci(d-12),n*16,t.pad,.045,{attack:n*4,delay:c,bus:this.exploreBus,filter:t.mood==="tense"?900:1400,detune:6}),this.tone(Ci(d-12),n*16,t.pad,.035,{attack:n*4,delay:c,bus:this.exploreBus,filter:1200,detune:-7});this.tone(Ci(h[0]-24),n*16,"sine",.12,{attack:.05,delay:c,bus:this.exploreBus})}if((t.mood==="calm"?[0,6,10]:t.mood==="mysterious"?[0,3,6,11,14]:[0,2,4,6,8,10,12,14]).includes(o)){const d=(e*7+r*3)%t.scale.length,f=h[0]+t.scale[d],m=o%4===0?12:24;this.tone(Ci(f+m-12),n*2.5,t.lead,.05,{delay:c,bus:this.exploreBus,filter:2600})}o%4===0&&this.kick(c),(o===4||o===12)&&this.snare(c),o%2===1&&this.noise(.04,.05,{type:"highpass",freq:7e3,delay:c,bus:this.combatBus}),o%2===0&&this.tone(Ci(h[0]-24),n*1.6,"sawtooth",.07,{delay:c,bus:this.combatBus,filter:500}),o===14&&e/16%2>=1&&this.tone(Ci(h[1]-12),n*2,"square",.03,{delay:c,bus:this.combatBus,filter:1400})}kick(t){this.tone(120,.22,"sine",.35,{slide:40,delay:t,bus:this.combatBus})}snare(t){this.noise(.14,.18,{type:"bandpass",freq:1800,q:.7,delay:t,bus:this.combatBus}),this.tone(200,.08,"triangle",.1,{slide:120,delay:t,bus:this.combatBus})}get combatLevel(){return this.combat}}const zs={fen:{bpm:92,chords:[[0,4,7],[-4,0,3],[5,9,12],[-5,-1,2]],scale:[0,2,4,7,9,12,14],pad:"triangle",lead:"sine",mood:"calm"},sanctum:{bpm:84,chords:[[0,3,7],[-2,2,5],[-4,0,3],[-5,-1,2]],scale:[0,3,5,7,10,12],pad:"sine",lead:"triangle",mood:"mysterious"},falls:{bpm:108,chords:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],scale:[0,2,4,7,9,11,12],pad:"triangle",lead:"triangle",mood:"bright"},frost:{bpm:96,chords:[[0,3,7],[8,12,15],[3,7,10],[10,14,17]],scale:[0,2,3,7,8,12],pad:"sine",lead:"sine",mood:"mysterious"},plains:{bpm:112,chords:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],scale:[0,2,4,5,7,9,12],pad:"triangle",lead:"square",mood:"heroic"},keep:{bpm:100,chords:[[0,3,7],[1,5,8],[-2,1,5],[-5,-1,2]],scale:[0,1,3,6,7,10],pad:"sawtooth",lead:"triangle",mood:"tense"},boss:{bpm:132,chords:[[0,3,7],[-2,2,5],[-4,0,3],[-5,-1,2]],scale:[0,3,5,7,10,12],pad:"sawtooth",lead:"square",mood:"tense"},title:{bpm:76,chords:[[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]],scale:[0,2,4,7,9,12],pad:"sine",lead:"triangle",mood:"calm"}},ux=new dx,fx=`
attribute float size;
attribute vec4 pcolor;
uniform float uScale;
varying vec4 vColor;
void main() {
  vColor = pcolor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uScale / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`,px=`
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 1.6) * vColor.a;
  gl_FragColor = vec4(vColor.rgb * a, a);
}`,mx=`
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = smoothstep(1.0, 0.55, d) * vColor.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb, a);
}`;class Kl{points;max;count=0;px;py;pz;vx;vy;vz;age;life;s0;s1;c0;c1;grav;drag;posAttr;colAttr;sizeAttr;uniforms;constructor(t,e){this.max=t,this.px=new Float32Array(t),this.py=new Float32Array(t),this.pz=new Float32Array(t),this.vx=new Float32Array(t),this.vy=new Float32Array(t),this.vz=new Float32Array(t),this.age=new Float32Array(t),this.life=new Float32Array(t),this.s0=new Float32Array(t),this.s1=new Float32Array(t),this.c0=new Float32Array(t*4),this.c1=new Float32Array(t*4),this.grav=new Float32Array(t),this.drag=new Float32Array(t);const i=new Se;this.posAttr=new qe(new Float32Array(t*3),3),this.colAttr=new qe(new Float32Array(t*4),4),this.sizeAttr=new qe(new Float32Array(t),1),this.posAttr.setUsage(fr),this.colAttr.setUsage(fr),this.sizeAttr.setUsage(fr),i.setAttribute("position",this.posAttr),i.setAttribute("pcolor",this.colAttr),i.setAttribute("size",this.sizeAttr),i.setDrawRange(0,0),this.uniforms={uScale:{value:400}};const n=new Be({uniforms:this.uniforms,vertexShader:fx,fragmentShader:e?px:mx,transparent:!0,depthWrite:!1,blending:e?xi:Un});this.points=new af(i,n),this.points.frustumCulled=!1,this.points.renderOrder=e?20:10}setViewportHeight(t,e){this.uniforms.uScale.value=t/(2*Math.tan(e*Math.PI/360))}get alive(){return this.count}spawn(t){let e=this.count;e>=this.max?e=Math.floor(Math.random()*this.max):this.count++,this.px[e]=t.x,this.py[e]=t.y,this.pz[e]=t.z,this.vx[e]=t.vx,this.vy[e]=t.vy,this.vz[e]=t.vz,this.age[e]=0,this.life[e]=t.life,this.s0[e]=t.size0,this.s1[e]=t.size1,this.c0[e*4]=t.color0.r,this.c0[e*4+1]=t.color0.g,this.c0[e*4+2]=t.color0.b,this.c0[e*4+3]=t.alpha0,this.c1[e*4]=t.color1.r,this.c1[e*4+1]=t.color1.g,this.c1[e*4+2]=t.color1.b,this.c1[e*4+3]=t.alpha1,this.grav[e]=t.gravity,this.drag[e]=t.drag}clear(){this.count=0,this.points.geometry.setDrawRange(0,0)}update(t){const e=this.posAttr.array,i=this.colAttr.array,n=this.sizeAttr.array;let s=0;for(;s<this.count;){if(this.age[s]+=t,this.age[s]>=this.life[s]){this.kill(s);continue}const r=Math.exp(-this.drag[s]*t);this.vx[s]*=r,this.vz[s]*=r,this.vy[s]=this.vy[s]*r-this.grav[s]*t,this.px[s]+=this.vx[s]*t,this.py[s]+=this.vy[s]*t,this.pz[s]+=this.vz[s]*t;const o=this.age[s]/this.life[s];e[s*3]=this.px[s],e[s*3+1]=this.py[s],e[s*3+2]=this.pz[s];for(let h=0;h<4;h++)i[s*4+h]=this.c0[s*4+h]+(this.c1[s*4+h]-this.c0[s*4+h])*o;n[s]=this.s0[s]+(this.s1[s]-this.s0[s])*o,s++}this.posAttr.needsUpdate=!0,this.colAttr.needsUpdate=!0,this.sizeAttr.needsUpdate=!0,this.points.geometry.setDrawRange(0,this.count)}kill(t){const e=--this.count;if(t!==e){this.px[t]=this.px[e],this.py[t]=this.py[e],this.pz[t]=this.pz[e],this.vx[t]=this.vx[e],this.vy[t]=this.vy[e],this.vz[t]=this.vz[e],this.age[t]=this.age[e],this.life[t]=this.life[e],this.s0[t]=this.s0[e],this.s1[t]=this.s1[e];for(let i=0;i<4;i++)this.c0[t*4+i]=this.c0[e*4+i],this.c1[t*4+i]=this.c1[e*4+i];this.grav[t]=this.grav[e],this.drag[t]=this.drag[e]}}}class _d{s;constructor(t=Date.now()&4294967295){this.s=t>>>0}next(){let t=this.s=this.s+1831565813>>>0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}range(t,e){return t+(e-t)*this.next()}int(t,e){return t+Math.floor(this.next()*(e-t+1))}chance(t){return this.next()<t}pick(t){return t[Math.floor(this.next()*t.length)]}signed(){return this.next()*2-1}}const nt=new _d;function gx(a){nt.s=a>>>0}const Jl=new Nt,Ql=new Nt,jl=new C,tc=new C,Ln=new C,sn=14;class vx{root=new kt;add=new Kl(5e3,!0);alpha=new Kl(3e3,!1);rings=[];swooshes=[];arcs=[];flashes=[];camera;density=1;constructor(t){this.camera=t,this.root.add(this.add.points,this.alpha.points);const e=new Ja(.85,1,48,1);e.rotateX(-Math.PI/2);for(let i=0;i<14;i++){const n=new si({color:16777215,transparent:!0,blending:xi,depthWrite:!1,side:we}),s=new J(e,n);s.visible=!1,s.renderOrder=25,this.root.add(s),this.rings.push({mesh:s,mat:n,t:0,dur:1,r0:0,r1:1,active:!1})}for(let i=0;i<10;i++){const n=new si({color:16777215,transparent:!0,blending:xi,depthWrite:!1,side:we,vertexColors:!0}),s=new Le,r=new J(new Se,n);r.renderOrder=26,s.add(r),s.visible=!1,this.root.add(s),this.swooshes.push({root:s,mesh:r,mat:n,t:0,dur:.2,active:!1})}for(let i=0;i<18;i++){const n=new Se;n.setAttribute("position",new qe(new Float32Array(sn*2*3),3));const s=[];for(let l=0;l<sn-1;l++){const c=l*2;s.push(c,c+1,c+2,c+1,c+3,c+2)}n.setIndex(s);const r=new si({color:16777215,transparent:!0,blending:xi,depthWrite:!1,side:we}),o=new J(n,r);o.frustumCulled=!1,o.visible=!1,o.renderOrder=27,this.root.add(o);const h=[];for(let l=0;l<sn;l++)h.push(new C);this.arcs.push({mesh:o,geo:n,mat:r,from:new C,to:new C,pts:h,t:0,dur:.1,width:.1,rejit:0,active:!1,chaos:.3})}for(let i=0;i<4;i++){const n=new Xf(16777215,0,12,1.6);this.root.add(n),this.flashes.push({light:n,t:1,dur:1,peak:0})}}setViewport(t,e){this.add.setViewportHeight(t,e),this.alpha.setViewportHeight(t,e)}clear(){this.add.clear(),this.alpha.clear();for(const t of this.rings)t.active=!1,t.mesh.visible=!1;for(const t of this.swooshes)t.active=!1,t.root.visible=!1;for(const t of this.arcs)t.active=!1,t.mesh.visible=!1;for(const t of this.flashes)t.t=t.dur,t.light.intensity=0}emit(t,e,i,n){const s=n.additive===!1?this.alpha:this.add,r=Math.max(1,Math.round(n.count*this.density)),o=n.bright??1;Jl.setHex(n.color).multiplyScalar(s===this.add?o:1),Ql.setHex(n.colorEnd??n.color).multiplyScalar(s===this.add?o:1);const h=n.speed??3,l=n.speedJitter??.4,c=n.spread??1,u=n.life??[.4,.8],d=n.size??[.2,.4],f=n.jitter??0;for(let m=0;m<r;m++){let v=nt.signed(),p=nt.signed(),g=nt.signed();const y=Math.hypot(v,p,g)||1;v/=y,p/=y,g/=y;const b=h*(1-l+nt.next()*l*2);let x,S,T;n.dir?(x=(n.dir[0]+v*c)*b,S=(n.dir[1]+p*c)*b,T=(n.dir[2]+g*c)*b):(x=v*b,S=p*b,T=g*b);const R=d[0]+nt.next()*(d[1]-d[0]);s.spawn({x:t+nt.signed()*f,y:e+nt.signed()*f,z:i+nt.signed()*f,vx:x,vy:S,vz:T,life:u[0]+nt.next()*(u[1]-u[0]),size0:R,size1:n.sizeEnd!==void 0?R*n.sizeEnd:R*.3,color0:Jl,color1:Ql,alpha0:n.alpha??1,alpha1:n.alphaEnd??0,gravity:n.gravity??0,drag:n.drag??1})}}hit(t,e,i,n=16773824,s=1){this.emit(t,e,i,{count:10*s,speed:7*s,life:[.12,.3],size:[.12,.28],color:n,colorEnd:16747069,drag:6,bright:2.5}),this.emit(t,e,i,{count:2,speed:.1,life:[.08,.12],size:[1.2*s,1.8*s],sizeEnd:1.4,color:n,bright:2})}dust(t,e,i,n=8,s=12101770){this.emit(t,e+.1,i,{count:n,speed:2.5,dir:[0,.35,0],spread:1,life:[.4,.9],size:[.4,.8],sizeEnd:2.2,color:s,alpha:.55,alphaEnd:0,drag:3,gravity:-.4,additive:!1,jitter:.3})}smoke(t,e,i,n=4,s=3814464){this.emit(t,e,i,{count:n,speed:1,dir:[0,1,0],spread:.6,life:[.6,1.2],size:[.5,.9],sizeEnd:2.5,color:s,alpha:.45,drag:1.5,gravity:-1,additive:!1,jitter:.2})}explosion(t,e,i,n,s,r=8396816){this.emit(t,e,i,{count:40,speed:n*5,life:[.25,.55],size:[.5,1.1],sizeEnd:.2,color:s,colorEnd:r,drag:4,bright:2.2}),this.emit(t,e,i,{count:3,speed:.2,life:[.15,.2],size:[n*2.2,n*2.6],sizeEnd:1.3,color:s,bright:1.6}),this.smoke(t,e,i,10,2761256),this.ring(t,e-.3,i,.3,n*1.4,s,.4),this.flash(t,e+.5,i,s,6,n*5,.3)}shatter(t,e,i,n=12580095){this.emit(t,e,i,{count:26,speed:8,dir:[0,.5,0],spread:1,life:[.4,.9],size:[.18,.4],sizeEnd:.6,color:n,colorEnd:6994175,gravity:16,drag:1,bright:1.8}),this.emit(t,e,i,{count:14,speed:3,life:[.3,.6],size:[.4,.8],sizeEnd:2,color:16777215,alpha:.5,additive:!1,drag:3}),this.ring(t,e-.5,i,.3,4,10479871,.35)}rocks(t,e,i,n=12,s=9075290){this.emit(t,e,i,{count:n,speed:6,dir:[0,.8,0],spread:.9,life:[.5,1],size:[.2,.45],sizeEnd:.9,color:s,gravity:18,drag:.5,additive:!1}),this.dust(t,e,i,n)}shadowPoof(t,e,i,n=1){this.emit(t,e,i,{count:24*n,speed:3*n,dir:[0,.6,0],spread:1,life:[.5,1.1],size:[.5,.9],sizeEnd:.1,color:11554047,colorEnd:1706032,drag:2,gravity:-2,bright:1.6,jitter:.4*n}),this.emit(t,e,i,{count:14*n,speed:1.5,dir:[0,1,0],spread:.6,life:[.8,1.4],size:[.8,1.3],sizeEnd:2,color:1182236,alpha:.6,additive:!1,drag:1.5,gravity:-1.5,jitter:.5*n})}sparkle(t,e,i,n,s=6){this.emit(t,e,i,{count:s,speed:1.6,life:[.3,.6],size:[.1,.22],sizeEnd:0,color:n,drag:2,bright:2.2,jitter:.15})}motes(t,e,i,n,s=10){this.emit(t,e,i,{count:s,speed:1.2,dir:[0,1.5,0],spread:.8,life:[.6,1.2],size:[.12,.25],sizeEnd:0,color:n,drag:1,gravity:-1.5,bright:2,jitter:.4})}splash(t,e,i,n=13627391){this.emit(t,e,i,{count:30,speed:6,dir:[0,1.2,0],spread:.7,life:[.4,.9],size:[.15,.35],sizeEnd:.5,color:n,gravity:18,drag:.4,additive:!1,alpha:.9}),this.ring(t,e+.05,i,.3,3,13627391,.6)}ring(t,e,i,n,s,r,o){const h=this.rings.find(l=>!l.active)??this.rings[0];h.active=!0,h.t=0,h.dur=o,h.r0=n,h.r1=s,h.mat.color.setHex(r),h.mesh.position.set(t,e+.08,i),h.mesh.scale.setScalar(n),h.mesh.visible=!0}swoosh(t,e,i,n,s,r,o,h="h",l=0,c=.18,u=.45,d){const f=this.swooshes.find(y=>!y.active)??this.swooshes[0];f.active=!0,f.t=0,f.dur=c,f.mesh.geometry.dispose();const m=d??(h==="h"?Math.PI/2-r/2:-r/2),v=new Ja(Math.max(.05,s-u),s,24,1,m,r),p=v.getAttribute("position"),g=new Float32Array(p.count*3);for(let y=0;y<p.count;y++){const b=y%25/24,x=Math.pow(b,1.5);g[y*3]=x,g[y*3+1]=x,g[y*3+2]=x}v.setAttribute("color",new qe(g,3)),f.mesh.geometry=v,f.mat.color.setHex(o).multiplyScalar(1.6),f.mat.opacity=1,f.root.position.set(t,e,i),f.root.rotation.set(0,n,0),h==="h"?f.mesh.rotation.set(Math.PI/2,0,0):f.mesh.rotation.set(0,-Math.PI/2,0),f.root.rotateZ(l),f.root.visible=!0}arc(t,e,i=12577023,n=.12,s=.1,r=.3){const o=this.arcs.find(h=>!h.active)??this.arcs[0];o.active=!0,o.t=0,o.dur=s,o.width=n,o.chaos=r,o.from.copy(t),o.to.copy(e),o.mat.color.setHex(i).multiplyScalar(2.2),o.rejit=0,this.jitterArc(o),o.mesh.visible=!0}jitterArc(t){const e=t.from.distanceTo(t.to);for(let i=0;i<sn;i++){const n=i/(sn-1),s=t.pts[i];if(s.lerpVectors(t.from,t.to,n),i>0&&i<sn-1){const r=e*t.chaos*Math.sin(n*Math.PI)*.35;s.x+=nt.signed()*r,s.y+=nt.signed()*r,s.z+=nt.signed()*r}}}flash(t,e,i,n,s,r,o){let h=this.flashes[0];for(const l of this.flashes)l.t/l.dur>h.t/h.dur&&(h=l);h.light.color.setHex(n),h.light.position.set(t,e,i),h.light.distance=r,h.peak=s,h.t=0,h.dur=o}update(t){this.add.update(t),this.alpha.update(t);for(const i of this.rings){if(!i.active)continue;i.t+=t;const n=i.t/i.dur;if(n>=1){i.active=!1,i.mesh.visible=!1;continue}const s=1-Math.pow(1-n,3);i.mesh.scale.setScalar(i.r0+(i.r1-i.r0)*s),i.mat.opacity=1-n}for(const i of this.swooshes){if(!i.active)continue;i.t+=t;const n=i.t/i.dur;if(n>=1){i.active=!1,i.root.visible=!1;continue}i.mat.opacity=1-n*n}const e=this.camera.position;for(const i of this.arcs){if(!i.active)continue;if(i.t+=t,i.t>=i.dur){i.active=!1,i.mesh.visible=!1;continue}i.rejit-=t,i.rejit<=0&&(i.rejit=.035,this.jitterArc(i));const n=i.geo.getAttribute("position"),s=n.array;for(let r=0;r<sn;r++){const o=i.pts[r],h=i.pts[Math.min(r+1,sn-1)],l=i.pts[Math.max(r-1,0)];jl.subVectors(h,l).normalize(),tc.subVectors(e,o).normalize(),Ln.crossVectors(jl,tc).normalize().multiplyScalar(i.width*(1-Math.abs(r/(sn-1)-.5)*.8)),s[r*6]=o.x+Ln.x,s[r*6+1]=o.y+Ln.y,s[r*6+2]=o.z+Ln.z,s[r*6+3]=o.x-Ln.x,s[r*6+4]=o.y-Ln.y,s[r*6+5]=o.z-Ln.z}n.needsUpdate=!0,i.mat.opacity=1-i.t/i.dur*.6}for(const i of this.flashes){if(i.t>=i.dur){i.light.intensity=0;continue}i.t+=t;const n=Math.min(1,i.t/i.dur);i.light.intensity=i.peak*(1-n)*(1-n)}}}const ec=Math.PI*2,Th=(a,t,e)=>a<t?t:a>e?e:a,Md=a=>a<0?0:a>1?1:a,Pt=(a,t,e)=>a+(t-a)*e,xx=(a,t,e)=>t===a?0:(e-a)/(t-a),le=(a,t,e)=>{const i=Md(xx(a,t,e));return i*i*(3-2*i)},Ft=(a,t,e,i)=>Pt(a,t,1-Math.exp(-e*i)),yx=a=>(a=(a+Math.PI)%ec,a<0&&(a+=ec),a-Math.PI),Vi=(a,t)=>yx(t-a),js=(a,t,e,i)=>a+Vi(a,t)*(1-Math.exp(-e*i)),Xi=(a,t,e)=>{const i=Vi(a,t);return Math.abs(i)<=e?t:a+Math.sign(i)*e},Ee=(a,t)=>Math.atan2(a,t);function La(a,t,e=0){let i=a*374761393+t*668265263+e*144269504|0;return i=Math.imul(i^i>>>13,1274126177),i^=i>>>16,(i>>>0)/4294967295*2-1}function _x(a,t,e=0){const i=Math.floor(a),n=Math.floor(t),s=a-i,r=t-n,o=s*s*(3-2*s),h=r*r*(3-2*r),l=La(i,n,e),c=La(i+1,n,e),u=La(i,n+1,e),d=La(i+1,n+1,e);return Pt(Pt(l,c,o),Pt(u,d,o),h)}function Ls(a,t,e=4,i=0){let n=0,s=.5,r=1,o=0;for(let h=0;h<e;h++)n+=_x(a*r,t*r,i+h*17)*s,o+=s,s*=.5,r*=2;return n/o}class Mx{yaw=0;pitch=.3;dist=6.8;curDist=6.8;focus=new C;shakeAmt=0;shakeTime=0;idleLook=0;furyT=0;fov=62;shot=null;shotBlend=0;shotLook=new C;shotPos=new C;lookAtV=new C;initialized=!1;extraDist=0;snapBehind(t,e=.3){this.yaw=t,this.pitch=e,this.initialized=!1}shake(t,e=.2){this.shakeAmt=Math.max(this.shakeAmt,t),this.shakeTime=Math.max(this.shakeTime,e)}furyZoom(t){this.furyT=t}setShot(t,e){this.shot||(this.shotPos.copy(this.lastPos),this.shotLook.copy(this.lookAtV)),this.shot={pos:t.clone(),look:e.clone()}}clearShot(){this.shot=null}get inShot(){return this.shot!==null}lastPos=new C;update(t,e){const i=e.camera,n=e.player,s=n.body,r=e.input,o=new C(s.x,s.y+1.25,s.z);this.initialized||(this.focus.copy(o),this.curDist=this.dist,this.initialized=!0);const h=Math.abs(r.lookX)+Math.abs(r.lookY)>1e-4;!this.shot&&e.state==="play"&&(this.yaw-=r.lookX,this.pitch=Th(this.pitch+r.lookY,-.3,1.1)),this.idleLook=h?0:this.idleLook+t,this.focus.x=Ft(this.focus.x,o.x,16,t),this.focus.z=Ft(this.focus.z,o.z,16,t);const l=o.y-this.focus.y;this.focus.y=Ft(this.focus.y,o.y,Math.abs(l)>3?12:s.grounded?8:3.5,t);const c=Math.hypot(s.vx,s.vz);if(n.lock&&n.lock.alive){const x=(n.lock.x+s.x)*.5,S=(n.lock.z+s.z)*.5,T=Ee(n.lock.x-s.x,n.lock.z-s.z);this.yaw=js(this.yaw,T,5,t),this.pitch=Ft(this.pitch,.38,3,t),this.focus.x=Ft(this.focus.x,x,3,t),this.focus.z=Ft(this.focus.z,S,3,t)}else if(e.options.autoCamera&&this.idleLook>.9&&c>3&&!this.shot&&e.state==="play"){const x=Ee(s.vx,s.vz);Math.abs(Vi(this.yaw,x))<2.3&&(this.yaw=js(this.yaw,x,n.gliding?1.8:.9,t)),n.gliding&&(this.pitch=Ft(this.pitch,.42,1,t))}let u=6.8+this.extraDist;n.gliding?u=8.2:n.state==="charge"&&(u=7.6),this.furyT>0&&(this.furyT-=t,u=10.5),this.dist=u;const d=Math.cos(this.pitch),f=new C(-Math.sin(this.yaw)*d,Math.sin(this.pitch),-Math.cos(this.yaw)*d),m=e.col.raycast(this.focus.x,this.focus.y,this.focus.z,f.x,f.y,f.z,this.dist,!0),v=Math.max(1.3,m.t-.35);v<this.curDist?this.curDist=v:this.curDist=Ft(this.curDist,Math.min(v,this.dist),3,t);const p=this.focus.clone().addScaledVector(f,this.curDist),g=e.col.terrainAt(p.x,p.z);g>-1e3&&p.y<g+.6&&(p.y=g+.6),e.waterLevel>-1e3&&p.y<e.waterLevel+.4&&(p.y=e.waterLevel+.4);const y=this.lookAtV.copy(this.focus);if(y.y+=.1,this.shotBlend=Ft(this.shotBlend,this.shot?1:0,3.2,t),this.shot&&(this.shotPos.lerp(this.shot.pos,1-Math.exp(-3*t)),this.shotLook.lerp(this.shot.look,1-Math.exp(-4*t))),this.shotBlend>.001?(p.lerp(this.shotPos,this.shotBlend),y.lerp(this.shotLook,this.shotBlend)):(this.shotPos.copy(p),this.shotLook.copy(y)),this.shakeTime>0){this.shakeTime-=t;const x=this.shakeAmt*e.options.shake;p.x+=nt.signed()*x*.5,p.y+=nt.signed()*x*.5,p.z+=nt.signed()*x*.5,this.shakeTime<=0?this.shakeAmt=0:this.shakeAmt*=Math.exp(-6*t)}i.position.copy(p),this.lastPos.copy(p),i.lookAt(y);let b=62;(n.gliding||n.state==="charge")&&(b=69),n.dragonTimeActive&&(b=56),this.furyT>0&&(b=70),this.fov=Ft(this.fov,b,4,t),Math.abs(i.fov-this.fov)>.01&&(i.fov=this.fov,i.updateProjectionMatrix())}}const Pe=-1e4;let wx=1;class Eh{shape;x=0;z=0;y0=0;y1=1;y2=1;hx=1;hz=1;r=1;yaw=0;cos=1;sin=0;enabled=!0;surface="stone";dynamic=!1;dx=0;dy=0;dz=0;dyaw=0;wallOnly=!1;tag="";owner=null;onStand=null;stamp=0;constructor(t){this.shape=t}setYaw(t){this.yaw=t,this.cos=Math.cos(t),this.sin=Math.sin(t)}get top(){return this.shape==="ramp"?Math.max(this.y1,this.y2):this.y1}get boundR(){return this.shape==="cyl"?this.r:Math.hypot(this.hx,this.hz)}toLocalX(t,e){const i=t-this.x,n=e-this.z;return i*this.cos-n*this.sin}toLocalZ(t,e){const i=t-this.x,n=e-this.z;return i*this.sin+n*this.cos}topAtLocal(t){if(this.shape!=="ramp")return this.y1;const e=Math.min(1,Math.max(0,(t+this.hz)/(2*this.hz)));return this.y1+(this.y2-this.y1)*e}topNear(t,e){return this.shape!=="ramp"?this.y1:this.topAtLocal(this.toLocalZ(t,e))}footprintDist(t,e){if(this.shape==="cyl")return Math.max(0,Math.hypot(t-this.x,e-this.z)-this.r);const i=this.toLocalX(t,e),n=this.toLocalZ(t,e),s=Math.max(0,Math.abs(i)-this.hx),r=Math.max(0,Math.abs(n)-this.hz);return Math.hypot(s,r)}}class Ah{x0;z0;cell;nx;nz;h;constructor(t,e,i,n,s,r){this.x0=t,this.z0=e,this.cell=i,this.nx=n,this.nz=s,this.h=r}static fromFunction(t,e,i,n,s,r){const o=Math.round(i/s)+1,h=Math.round(n/s)+1,l=new Float32Array(o*h);for(let c=0;c<h;c++)for(let u=0;u<o;u++)l[c*o+u]=r(t+u*s,e+c*s);return new Ah(t,e,s,o,h,l)}vertex(t,e){return t<0||e<0||t>=this.nx||e>=this.nz?Pe:this.h[e*this.nx+t]}at(t,e){const i=(t-this.x0)/this.cell,n=(e-this.z0)/this.cell,s=Math.floor(i),r=Math.floor(n);if(s<0||r<0||s>=this.nx-1||r>=this.nz-1)return-1/0;const o=i-s,h=n-r,l=this.vertex(s,r),c=this.vertex(s+1,r),u=this.vertex(s,r+1),d=this.vertex(s+1,r+1);return o+h<=1?l<=Pe||c<=Pe||u<=Pe?-1/0:l+(c-l)*o+(u-l)*h:d<=Pe||c<=Pe||u<=Pe?-1/0:d+(u-d)*(1-o)+(c-d)*(1-h)}}class wd{x=0;y=0;z=0;vx=0;vy=0;vz=0;radius;height;stepUp=.45;grounded=!1;ground=null;groundY=-1/0;hitWall=!1;wallNX=0;wallNZ=0;hitCeiling=!1;maxSlope=1.3;constructor(t,e){this.radius=t,this.height=e}setPos(t,e,i){this.x=t,this.y=e,this.z=i}}const Da=8,bx=(a,t)=>(a+2048)*4096+(t+2048);class Sx{terrain=null;solids=[];dynamics=[];grid=new Map;scratch=[];add(t){return this.solids.push(t),t.dynamic?this.dynamics.push(t):this.insert(t),t}remove(t){const e=this.solids.indexOf(t);e>=0&&this.solids.splice(e,1);const i=this.dynamics.indexOf(t);i>=0?this.dynamics.splice(i,1):this.forCells(t.x,t.z,t.boundR,n=>{const s=n.indexOf(t);s>=0&&n.splice(s,1)})}insert(t){this.forCells(t.x,t.z,t.boundR,e=>e.push(t),!0)}forCells(t,e,i,n,s=!1){const r=Math.floor((t-i)/Da),o=Math.floor((t+i)/Da),h=Math.floor((e-i)/Da),l=Math.floor((e+i)/Da);for(let c=r;c<=o;c++)for(let u=h;u<=l;u++){const d=bx(c,u);let f=this.grid.get(d);if(!f){if(!s)continue;f=[],this.grid.set(d,f)}n(f)}}query(t,e,i){const n=this.scratch;n.length=0;const s=++wx;this.forCells(t,e,i,r=>{for(const o of r)o.stamp!==s&&(o.stamp=s,n.push(o))});for(const r of this.dynamics)n.push(r);return n}terrainAt(t,e){return this.terrain?this.terrain.at(t,e):-1/0}groundAt(t,e,i,n){let s=this.terrainAt(t,e),r=null;for(const o of this.query(t,e,n)){if(!o.enabled||o.wallOnly||o.footprintDist(t,e)>n)continue;const h=o.topNear(t,e);h<=i&&h>s&&(s=h,r=o)}return{y:s,solid:r}}carry(t){const e=t.ground;if(!(!e||!t.grounded||!e.dynamic)){if(e.dyaw!==0){const i=t.x-(e.x-e.dx),n=t.z-(e.z-e.dz),s=Math.cos(e.dyaw),r=Math.sin(e.dyaw);t.x=e.x-e.dx+i*s+n*r,t.z=e.z-e.dz-i*r+n*s}t.x+=e.dx,t.y+=e.dy,t.z+=e.dz}}move(t,e){const i=t.grounded;t.hitWall=!1,t.hitCeiling=!1;const n=t.vx*e,s=t.vz*e,r=Math.hypot(n,s),o=Math.max(1,Math.ceil(r/(t.radius*.7)));for(let d=0;d<o;d++){const f=t.x,m=t.z;t.x+=n/o,t.z+=s/o,this.terrain&&!this.terrainPassable(t,f,m,i)&&(t.x=f+n/o,t.z=m,this.terrainPassable(t,f,m,i)||(t.x=f,t.z=m+s/o,this.terrainPassable(t,f,m,i)||(t.z=m)),t.hitWall=!0),this.resolveWalls(t)}const h=t.y;if(t.y+=t.vy*e,t.vy>0){const d=t.y+t.height,f=h+t.height;for(const m of this.query(t.x,t.z,t.radius))m.enabled&&(m.footprintDist(t.x,t.z)>t.radius*.5||m.y0>=f-.05&&m.y0<d&&(t.y=m.y0-t.height,t.vy=0,t.hitCeiling=!0))}const l=Math.max(h,t.y)+t.stepUp,c=this.groundAt(t.x,t.z,l,t.radius*.6);t.groundY=c.y;const u=i?.4:0;t.vy<=0&&t.y<=c.y+u&&c.y>-1/0?(t.y=c.y,t.vy=0,t.grounded=!0,t.ground=c.solid,c.solid?.onStand&&c.solid.onStand(t)):(t.grounded=!1,t.ground=null)}terrainPassable(t,e,i,n){const s=this.terrainAt(t.x,t.z);if(s===-1/0)return!0;const r=s-t.y;if(r<=.02)return!0;if(r>t.stepUp)return!1;if(!n)return!0;const o=Math.hypot(t.x-e,t.z-i);return o<=0||r/o<=t.maxSlope}resolveWalls(t){const e=t.y,i=t.y+t.height,n=t.radius;for(let s=0;s<2;s++){let r=!1;for(const o of this.query(t.x,t.z,n)){if(!o.enabled||o.y0>=i-.01)continue;const h=o.topNear(t.x,t.z);if(!o.wallOnly&&h<=e+t.stepUp)continue;if(o.shape==="cyl"){const T=t.x-o.x,R=t.z-o.z,M=Math.hypot(T,R),E=n+o.r;if(M>=E)continue;const L=M>1e-6?T/M:1,N=M>1e-6?R/M:0;t.x=o.x+L*E,t.z=o.z+N*E,this.noteWall(t,L,N),r=!0;continue}const l=o.toLocalX(t.x,t.z),c=o.toLocalZ(t.x,t.z),u=Math.max(-o.hx,Math.min(o.hx,l)),d=Math.max(-o.hz,Math.min(o.hz,c));let f=l-u,m=c-d;const v=Math.hypot(f,m);let p,g,y;if(v>1e-6){if(v>=n)continue;p=f/v,g=m/v,y=n-v}else{const T=o.hx-Math.abs(l),R=o.hz-Math.abs(c);T<R?(p=Math.sign(l)||1,g=0,y=T+n):(p=0,g=Math.sign(c)||1,y=R+n)}f=p*y,m=g*y;const b=f*o.cos+m*o.sin,x=-f*o.sin+m*o.cos;t.x+=b,t.z+=x;const S=Math.hypot(b,x)||1;this.noteWall(t,b/S,x/S),r=!0}if(!r)break}}noteWall(t,e,i){t.hitWall=!0,t.wallNX=e,t.wallNZ=i;const n=t.vx*e+t.vz*i;n<0&&(t.vx-=n*e,t.vz-=n*i)}blocked(t,e,i,n,s){for(const r of this.query(t,i,n))if(r.enabled&&!(r.y0>=e+s||r.top<=e)&&r.footprintDist(t,i)<n)return!0;return!1}raycast(t,e,i,n,s,r,o,h=!1){let l=o,c=null;const u=t+n*o*.5,d=i+r*o*.5,f=o*.5*Math.hypot(n,r)+1;for(const m of this.query(u,d,f)){if(!m.enabled||h&&m.dynamic)continue;const v=m.shape==="cyl"?Ex(m,t,e,i,n,s,r):Tx(m,t,e,i,n,s,r);v>=0&&v<l&&(l=v,c=m)}if(this.terrain){const m=this.rayTerrain(t,e,i,n,s,r,l);m<l&&(l=m,c=null)}return{t:l,solid:c}}rayTerrain(t,e,i,n,s,r,o){let l=0,c=e-this.terrainAt(t,i)>=0;if(!c)return 0;for(let u=.4;u<=o+.4;u+=.4){const d=Math.min(u,o),f=e+s*d-this.terrainAt(t+n*d,i+r*d)>=0;if(!f){let m=l,v=d;for(let p=0;p<6;p++){const g=(m+v)*.5;e+s*g-this.terrainAt(t+n*g,i+r*g)>=0?m=g:v=g}return m}if(l=d,c=f,d>=o)break}return 1/0}}function Tx(a,t,e,i,n,s,r){const o=a.toLocalX(t,i),h=a.toLocalZ(t,i),l=n*a.cos-r*a.sin,c=n*a.sin+r*a.cos;let u=-1/0,d=1/0;const f=(m,v,p,g)=>{if(Math.abs(v)<1e-9)return m>=p&&m<=g;let y=(p-m)/v,b=(g-m)/v;return y>b&&([y,b]=[b,y]),y>u&&(u=y),b<d&&(d=b),u<=d};return!f(o,l,-a.hx,a.hx)||!f(e,s,a.y0,a.top)||!f(h,c,-a.hz,a.hz)||d<0?-1:u>=0?u:0}function Ex(a,t,e,i,n,s,r){const o=t-a.x,h=i-a.z,l=n*n+r*r;let c=-1;if(l>1e-9){const u=2*(o*n+h*r),d=o*o+h*h-a.r*a.r,f=u*u-4*l*d;if(f>=0){const m=Math.sqrt(f);for(const v of[(-u-m)/(2*l),(-u+m)/(2*l)]){if(v<0)continue;const p=e+s*v;if(p>=a.y0&&p<=a.y1){c=v;break}}}}if(Math.abs(s)>1e-9)for(const u of[a.y0,a.y1]){const d=(u-e)/s;if(d<0)continue;const f=o+n*d,m=h+r*d;f*f+m*m<=a.r*a.r&&(c<0||d<c)&&(c=d)}return o*o+h*h<=a.r*a.r&&e>=a.y0&&e<=a.y1?0:c}function On(a,t,e,i,n,s,r=0){const o=new Eh("box");return o.x=a,o.z=t,o.hx=e,o.hz=i,o.y0=n,o.y1=s,o.setYaw(r),o}function ic(a,t,e,i,n,s,r,o=0){const h=new Eh("ramp");return h.x=a,h.z=t,h.hx=e,h.hz=i,h.y0=n,h.y1=s,h.y2=r,h.setYaw(o),h}function hi(a,t,e,i,n){const s=new Eh("cyl");return s.x=a,s.z=t,s.r=e,s.y0=i,s.y1=n,s}const nc=new Map;function at(a,t={}){const e=`${a}|${t.emissive??0}|${t.emissiveIntensity??1}|${t.rough??.85}|${t.metal??0}|${t.flat?1:0}|${t.transparent?1:0}|${t.opacity??1}|${t.side??0}|${t.vertexColors?1:0}`;let i=nc.get(e);return i||(i=yi(a,t),nc.set(e,i)),i}function yi(a,t={}){return new Ki({color:a,emissive:t.emissive??0,emissiveIntensity:t.emissiveIntensity??1,roughness:t.rough??.85,metalness:t.metal??0,flatShading:t.flat??!1,transparent:t.transparent??!1,opacity:t.opacity??1,side:t.side??Sn,vertexColors:t.vertexColors??!1})}function te(a,t=1,e=!1){return new si({color:a,transparent:t<1||e,opacity:t,blending:e?xi:Un,depthWrite:!e,fog:!e})}const sc=new Map;function Rh(a=16){let t=sc.get(a);return t||(t=new wi(1,a,Math.max(6,Math.round(a*.75))),sc.set(a,t)),t}function Dt(a,t,e,i,n=16){const s=new J(Rh(n),i);return s.scale.set(a,t,e),s.castShadow=!0,s}function $i(a,t,e,i=10,n=8,s=!0){const r=new Qc(a),o=r.computeFrenetFrames(i,!1),h=[],l=[],c=[],u=new C,d=new C;for(let m=0;m<=i;m++){const v=m/i;r.getPointAt(v,u);const p=t+(e-t)*v,g=o.normals[m],y=o.binormals[m];for(let b=0;b<=n;b++){const x=b/n*Math.PI*2,S=Math.sin(x),T=-Math.cos(x);d.set(T*g.x+S*y.x,T*g.y+S*y.y,T*g.z+S*y.z).normalize(),h.push(u.x+p*d.x,u.y+p*d.y,u.z+p*d.z),l.push(d.x,d.y,d.z)}}for(let m=0;m<i;m++)for(let v=0;v<n;v++){const p=m*(n+1)+v,g=(m+1)*(n+1)+v;c.push(p,g,p+1,g,g+1,p+1)}if(s&&e>1e-4){r.getPointAt(1,u);const m=h.length/3,v=o.tangents[i];h.push(u.x+v.x*e,u.y+v.y*e,u.z+v.z*e),l.push(v.x,v.y,v.z);const p=i*(n+1);for(let g=0;g<n;g++)c.push(p+g,m,p+g+1)}const f=new Se;return f.setAttribute("position",new Jt(h,3)),f.setAttribute("normal",new Jt(l,3)),f.setIndex(c),f}function We(a,t,e,i,n,s=8){const r=a.distanceTo(t),o=new ne(i,e,r,s,1);o.translate(0,r/2,0);const h=new J(o,n);h.position.copy(a);const l=new C().subVectors(t,a).normalize();return h.quaternion.setFromUnitVectors(new C(0,1,0),l),h.castShadow=!0,h}function Ae(a,t,e,i=6){const n=new cn(a,t,i,1);n.translate(0,t/2,0);const s=new J(n,e);return s.castShadow=!0,s}function Zr(a,t){const e=new wh;e.moveTo(a[0][0],a[0][1]);for(let s=1;s<a.length;s++)e.lineTo(a[s][0],a[s][1]);e.closePath();const i=new nr(e,4);i.rotateX(Math.PI/2);const n=new J(i,t);return n.castShadow=!0,n}function ac(a,t,e,i){const n=new J(new ke(a,t,e),i);return n.castShadow=!0,n.receiveShadow=!0,n}const bd={body:9064408,belly:15910490,horn:16110202,membrane:15901498,eye:7266426,spikes:16110202,scale:1,hornStyle:"swept",tailStyle:"arrow",slender:.2};function Ch(){return{speed:0,grounded:!0,vy:0,glide:!1,flapT:1,breath:!1,aimPitch:0,attack:null,attackT:0,charge:!1,dodge:-1,hurt:0,dead:!1,turn:0,talk:!1,hover:!1}}const he=(a,t,e)=>new C(a,t,e);class Ph{root=new kt;model=new kt;hips=new kt;neck=new kt;head=new kt;jaw=new kt;mouth=new Le;hornTip=new Le;tailTip=new Le;wings=[];legs=[];tail=[];eyes=[];flashMats=[];look;gait=0;time=Math.random()*10;blink=0;nextBlink=2;p={bodyPitch:0,bodyRoll:0,bodyY:0,bodyYaw:0,neckPitch:-.75,headPitch:.6,headYaw:0,jaw:0,wingSpread:0,wingFlap:0,tailYaw:0,tailPitch:0,tuck:0,spin:0,flip:0,roll:0,squash:0};lastGrounded=!0;flapT=1;constructor(t=bd){this.look=t,this.build(),this.root.add(this.model),this.model.scale.setScalar(t.scale)}bodyMat(t){const e=yi(t,{rough:.6});return this.flashMats.push(e),e}build(){const t=this.look,e=t.slender,i=this.bodyMat(t.body),n=this.bodyMat(t.belly),s=at(t.horn,{rough:.4,metal:.2}),r=at(t.spikes,{rough:.45,metal:.15}),o=yi(t.membrane,{rough:.7,side:we,transparent:!0,opacity:.92}),h=at(16051416,{rough:.5});this.model.add(this.hips),this.hips.position.set(0,.6,0);const l=.62+e*.18,c=Dt(.36-e*.06,.34-e*.04,l,i,20);this.hips.add(c);const u=Dt(.33-e*.05,.33,.34,i,16);u.position.set(0,.06,l*.55),this.hips.add(u);const d=Dt(.27-e*.05,.22,l*.92,n,16);d.position.set(0,-.12,.04),this.hips.add(d);for(let k=0;k<5;k++){const D=Dt(.25-e*.04,.05,.1,n,10);D.position.set(0,-.26+Math.abs(k-2)*.012,-.34+k*.17),this.hips.add(D)}for(let k=0;k<5;k++){const D=Ae(.05,.14-Math.abs(k-1.5)*.015,r,5);D.position.set(0,.32-Math.abs(k-1)*.02,.35-k*.2),D.rotation.x=-.5,this.hips.add(D)}this.neck.position.set(0,.14,l*.72),this.hips.add(this.neck);const f=.42+e*.25;this.neck.add(We(he(0,0,-.05),he(0,0,f),.2,.15,i,12));const m=We(he(0,-.1,0),he(0,-.08,f*.95),.12,.09,n,10);this.neck.add(m);for(let k=0;k<3;k++){const D=Ae(.04,.1,r,5);D.position.set(0,.15-k*.012,.05+k*f*.3),D.rotation.x=-.9,this.neck.add(D)}this.head.position.set(0,0,f),this.neck.add(this.head);const v=Dt(.24,.22,.27,i,18);v.position.set(0,.06,.05),this.head.add(v);const p=Dt(.17,.13,.25+e*.05,i,16);p.position.set(0,0,.3),this.head.add(p);const g=Dt(.12,.08,.1,i,12);g.position.set(0,.04,.5+e*.05),this.head.add(g);for(const k of[-1,1]){const D=Dt(.02,.015,.02,at(2758208),6);D.position.set(k*.05,.08,.58+e*.05),this.head.add(D);const I=Dt(.08,.04,.12,i,10);I.position.set(k*.12,.2,.2),I.rotation.z=k*.3,this.head.add(I);const P=Ae(.035,.14,r,5);P.position.set(k*.2,-.02,-.05),P.rotation.set(-1.9,0,k*-.7),this.head.add(P)}this.jaw.position.set(0,-.08,.08),this.head.add(this.jaw);const y=Dt(.14,.055,.22,n,12);y.position.set(0,-.01,.15),this.jaw.add(y);const b=Dt(.07,.02,.13,at(14176362),8);b.position.set(0,.03,.15),this.jaw.add(b),this.mouth.position.set(0,-.02,.62),this.head.add(this.mouth);const x=at(16777215,{rough:.2}),S=t.glowEyes?te(t.eye):at(t.eye,{rough:.2,emissive:t.eye,emissiveIntensity:.25}),T=at(1050650,{rough:.1});for(const k of[-1,1]){const D=new kt;D.position.set(k*.13,.13,.22),D.rotation.y=k*.55;const I=Dt(.085,.095,.06,x,12);D.add(I);const P=Dt(.055,.07,.03,S,10);P.position.set(0,0,.045),D.add(P);const B=Dt(.022,.05,.02,T,8);B.position.set(0,0,.062),D.add(B);const O=Dt(.014,.014,.01,te(16777215),6);O.position.set(.02,.03,.072),D.add(O),this.head.add(D),this.eyes.push(D)}this.buildHorns(s),this.hornTip.position.set(0,.3,.1),this.head.add(this.hornTip);for(let k=0;k<3;k++){const D=Ae(.03,.09,r,5);D.position.set(0,.24-k*.02,-.05-k*.09),D.rotation.x=-1.1,this.head.add(D)}if(t.beard)for(let k=0;k<4;k++){const D=Ae(.04,.22-k*.03,at(15261904),5);D.position.set((k-1.5)*.06,-.12,.1-Math.abs(k-1.5)*.03),D.rotation.x=Math.PI*.85,this.jaw.add(D)}for(const k of[1,-1]){const D=new kt;D.position.set(k*.2,.26,l*.35),D.scale.x=k;const I=new kt,P=.55+e*.15;D.add(We(he(0,0,0),he(P,.04,.02),.045,.035,i,6));const B=Zr([[0,.02],[P,.02],[P*.95,-.34],[P*.55,-.42],[P*.2,-.55],[0,-.5]],o);D.add(B),I.position.set(P,.04,.02),D.add(I),I.add(We(he(0,0,0),he(.62+e*.2,.08,.1),.035,.018,i,6));const O=.62+e*.2,j=Zr([[0,0],[O,.1],[O*.82,-.12],[O*.62,-.2],[O*.45,-.3],[O*.22,-.36],[0,-.36]],o);I.add(j);const q=Ae(.025,.1,h,5);q.position.set(0,.03,.02),q.rotation.z=-.4,I.add(q),this.hips.add(D),this.wings.push({root:D,outer:I,side:k})}const R=[[.21,.02,l*.62,!0],[-.21,.02,l*.62,!0],[.23,.02,-l*.58,!1],[-.23,.02,-l*.58,!1]];for(const[k,D,I,P]of R){const B=new kt;B.position.set(k,D,I),this.hips.add(B);const O=Dt(P?.1:.15,P?.13:.18,P?.11:.17,i,12);O.position.set(0,-.05,0),B.add(O),B.add(We(he(0,0,0),he(0,-.28,P?.02:-.04),.11,.085,i,8));const j=new kt;j.position.set(0,-.28,P?.02:-.04),B.add(j),j.add(We(he(0,0,0),he(0,-.27,P?.03:.06),.085,.07,i,8));const q=new kt;q.position.set(0,-.27,P?.03:.06),j.add(q);const tt=Dt(.1,.055,.13,i,10);tt.position.set(0,.02,.04),q.add(tt);for(let Tt=-1;Tt<=1;Tt++){const ce=Ae(.022,.08,h,4);ce.position.set(Tt*.05,.01,.13),ce.rotation.x=Math.PI/2,q.add(ce)}const it=k>0?1:-1,It=(P?0:Math.PI)+(it>0?0:Math.PI);this.legs.push({hip:B,knee:j,foot:q,front:P,side:it,phase:It})}const M=9;let E=this.hips;const L=.17+e*.04;for(let k=0;k<M;k++){const D=new kt;D.position.set(0,k===0?.05:0,k===0?-l*.9:-L);const I=Pt(.16,.04,k/M),P=Pt(.16,.04,(k+1)/M);if(D.add(We(he(0,0,.02),he(0,0,-L-.02),I,P,i,8)),k%2===0&&k<M-1){const B=Ae(.03,.08-k*.005,r,5);B.position.set(0,I*.9,-L*.5),B.rotation.x=-1,D.add(B)}E.add(D),this.tail.push(D),E=D}const N=new kt;N.position.set(0,0,-L),E.add(N),this.buildTailTip(N,s),this.tailTip.position.set(0,0,-.3),N.add(this.tailTip)}buildHorns(t){const e=this.look.hornStyle;for(const i of[-1,1]){let n,s=.055;switch(e){case"curled":n=[he(0,0,0),he(i*.1,.1,-.12),he(i*.2,.02,-.25),he(i*.18,-.12,-.2),he(i*.12,-.1,-.08)],s=.07;break;case"crown":n=[he(0,0,0),he(i*.05,.18,-.04),he(i*.1,.36,-.1)];break;case"blade":n=[he(0,0,0),he(i*.06,.08,-.2),he(i*.1,.1,-.46)],s=.045;break;default:n=[he(0,0,0),he(i*.06,.12,-.14),he(i*.1,.18,-.36)]}const r=new J($i(n,s,.005,10,7),t);if(r.position.set(i*.12,.2,-.02),r.castShadow=!0,this.head.add(r),e==="crown")for(let o=0;o<2;o++){const h=new J($i([he(0,0,0),he(i*.1,.1,-.1),he(i*.18,.14,-.26)],.035,.004,8,6),t);h.position.set(i*.17,.12-o*.08,-.05),this.head.add(h)}}}buildTailTip(t,e){const i=this.look.tailStyle;if(i==="club"){const r=Dt(.13,.11,.16,e,10);r.position.z=-.12,t.add(r);for(const[o,h]of[[.1,0],[-.1,0],[0,.1],[0,-.1]]){const l=Ae(.04,.1,e,5);l.position.set(o,h,-.12),l.lookAt(o*10,h*10,-.12),l.rotateX(Math.PI/2),t.add(l)}return}const s=Zr(i==="fan"?[[0,.05],[.2,-.1],[.24,-.3],[0,-.22],[-.24,-.3],[-.2,-.1]]:i==="scythe"?[[.02,.05],[.1,-.1],[.3,-.34],[.05,-.22],[-.08,-.3],[-.06,-.05]]:[[0,.06],[.16,-.12],[.04,-.1],[0,-.34],[-.04,-.1],[-.16,-.12]],yi(this.look.horn,{rough:.35,metal:.25,side:we}));s.rotation.set(0,0,Math.PI/2),t.add(s)}setFlash(t,e=16777215){for(const i of this.flashMats)i.emissive.setHex(e),i.emissiveIntensity=t}setOpacity(t){for(const e of this.flashMats)e.transparent=t<1,e.opacity=t}update(t,e){this.time+=t;const i=this.time,n=this.p;this.nextBlink-=t,this.nextBlink<=0&&(this.blink=.14,this.nextBlink=2+Math.random()*3),this.blink=Math.max(0,this.blink-t);const s=e.dead||e.sleep?.12:this.blink>0?.15:1;for(const P of this.eyes)P.scale.y=Ft(P.scale.y,s,40,t);e.flapT===0&&(this.flapT=0),this.flapT=Math.min(1,this.flapT+t*2.8);const r=Md(e.speed),o=!e.grounded;this.gait+=t*(e.charge?17:5+r*9)*(o?0:1);const h=this.gait;let l=o?Ia(-e.vy*.03,-.35,.4):Math.sin(h*2)*.03*r,c=Ia(-e.turn*.08,-.5,.5),u=o?0:Math.abs(Math.sin(h))*.06*r+Math.sin(i*2)*.012*(1-r),d=0,f=-.75+r*.28+Math.sin(i*2)*.02,m=.62-r*.2,v=Math.sin(i*.37)*.15*(1-r),p=0,g=o?.55:0,y=o?Math.sin(i*5)*.15:0,b=Ia(-e.turn*.12,-.5,.5),x=o?.15:-.05,S=o?.6:0,T=0,R=0,M=0,E=14;if(e.glide&&(g=1,y=Math.sin(i*2)*.06,l=.12,f=-.35,m=.3,S=.9,c=Ia(-e.turn*.25,-.7,.7)),e.hover&&(g=1,y=Math.sin(i*16)*.55,S=.5),this.flapT<1){const P=this.flapT;g=1,y=Math.sin(P*Math.PI*2)*.9,S=.8}if(e.charge&&(f=-.25,m=.55,l=.12,g=.35,y=-.2,x=.1),e.breath&&(f=-.35-e.aimPitch*.5,m=.25-e.aimPitch*.5,p=.55+Math.sin(i*30)*.05,l-=.05,E=20),e.talk&&(p=Math.max(p,(Math.sin(i*16)*.5+.5)*.25),m+=Math.sin(i*5)*.06),e.dodge>=0&&(M=e.dodge*Math.PI*2,S=1,g=.2,E=40),e.attack){E=30;const P=e.attackT;switch(e.attack){case"horn1":{const B=Kr(P,.15,.45,.9);f=Pt(-.6,-.1,B),m=Pt(.5,1,B),l=.12*B;break}case"horn2":{const B=le(.1,.55,P);v=Pt(.8,-.8,B),d=Pt(.35,-.35,B),f=-.3,m=.8;break}case"horn3":{const B=Kr(P,.1,.4,.95);f=Pt(-.5,.05,B),m=Pt(.4,1.1,B),l=Pt(-.15,.3,B),x=.4*B;break}case"horn4":{T=le(.05,.7,P)*Math.PI*2,f=-.1,m=1,S=.3;break}case"counter":{T=le(0,.5,P)*Math.PI*2;const B=Kr(P,.3,.55,1);f=Pt(-.4,.1,B),m=Pt(.5,1.1,B),g=.8;break}case"uppercut":{const B=1-le(0,.3,P),O=le(.25,.6,P);f=Pt(.1*B,-1.25,O),m=Pt(1.1,-.3,O),l=Pt(.25,-.45,O),g=O*.7,x=-.3*O;break}case"tail1":case"tail2":{const B=e.attack==="tail1"?1:-1;T=B*rc(le(.05,.75,P))*Math.PI*2,x=.25,b=-B*.6,f=-.5,l=.05;break}case"tail3":{const B=le(0,.35,P)*(1-le(.4,.55,P));l=Pt(.35,-.5,B),x=Pt(-1.4,.9,B),f=Pt(-.2,-.9,B);break}case"tailSpin":{T=P*Math.PI*2*3,x=.3,S=.3,g=.5;break}case"air1":case"air2":{const B=e.attack==="air1"?1:-1,O=le(.1,.55,P);v=B*Pt(.8,-.8,O),d=B*Pt(.4,-.4,O),f=-.35,m=.8,g=.9,y=Math.sin(P*12)*.4;break}case"air3":{R=rc(le(.05,.8,P))*Math.PI*2,S=1,g=.3;break}case"slamFall":{R=this.p.flip+t*16,S=1,g=0,f=.2,m=1.2;break}case"slamLand":{const B=1-P;g=1,y=-.4*B,l=.2*B,f=-.2,m=1;break}case"burst":{const B=le(0,.35,P)*(1-le(.35,.5,P)),O=le(.35,.5,P)*(1-le(.8,1,P));f=-.9*B-.2*O-e.aimPitch*.4,m=-.3*B+.2*O-e.aimPitch*.4,p=.8*O+.3*B,l=-.25*B+.1*O,g=.6;break}case"fury":{f=-1.3,m=-.4,p=.9,g=1,y=Math.sin(P*30)*.3,l=-.5,S=.8;break}case"roar":{f=-1,m=-.2,p=.8,g=.9,l=-.2;break}}}if(e.hurt>0){const P=e.hurt;f-=.4*P,m-=.4*P,l-=.15*P,E=25}e.dead&&(M=1.45,u=-.3,f=.1,m=.1,g=.3,S=.2,E=6),e.sleep&&(f=.3,m=.1,u=-.35,S=0,E=4),e.grounded&&!this.lastGrounded&&(n.squash=Math.min(.35,.12+Math.max(0,-e.vy)*.015)),this.lastGrounded=e.grounded,n.squash=Ft(n.squash,0,10,t),n.bodyPitch=Ft(n.bodyPitch,l,E,t),n.bodyRoll=Ft(n.bodyRoll,c,8,t),n.bodyY=Ft(n.bodyY,u,18,t),n.bodyYaw=Ft(n.bodyYaw,d,E,t),n.neckPitch=Ft(n.neckPitch,f,E,t),n.headPitch=Ft(n.headPitch,m,E,t),n.headYaw=js(n.headYaw,v,E,t),n.jaw=Ft(n.jaw,p,25,t),n.wingSpread=Ft(n.wingSpread,g,12,t),n.wingFlap=Ft(n.wingFlap,y,22,t),n.tailYaw=Ft(n.tailYaw,b,8,t),n.tailPitch=Ft(n.tailPitch,x,8,t),n.tuck=Ft(n.tuck,S,14,t),n.spin=T,n.flip=(e.attack==="slamFall",R),n.roll=e.dead?Ft(n.roll,M,6,t):M,this.model.rotation.set(0,0,0),this.model.position.set(0,0,0);const L=.7*this.look.scale;if(this.model.position.y=n.bodyY+(n.flip!==0||n.roll!==0,0),this.model.rotation.order="YXZ",this.model.rotation.y=n.spin,this.model.rotation.x=n.flip,this.model.rotation.z=n.roll,n.flip!==0||n.roll!==0){const P=new C(0,L,0).applyEuler(this.model.rotation);this.model.position.set(-P.x,n.bodyY+L-P.y,-P.z)}const N=n.squash,k=this.look.scale;this.model.scale.set(k*(1+N*.5),k*(1-N),k*(1+N*.5)),this.hips.rotation.set(n.bodyPitch,n.bodyYaw,n.bodyRoll),this.neck.rotation.set(n.neckPitch,n.headYaw*.4,0),this.head.rotation.set(n.headPitch-n.neckPitch*.15,n.headYaw*.6,0),this.jaw.rotation.x=n.jaw;for(const P of this.wings){const B=n.wingSpread;P.root.rotation.order="YZX",P.root.rotation.y=P.side*Pt(1.35,.12,B),P.root.rotation.z=P.side*(Pt(.6,.08,B)+n.wingFlap),P.root.rotation.x=0,P.root.scale.z=Pt(.3,1,B),P.outer.rotation.set(0,Pt(.35,0,B),Pt(-.25,n.wingFlap*.6,B))}for(const P of this.legs){const B=h+P.phase;let O=Math.sin(B)*.65*r*(e.charge?1.3:1),j=Math.max(0,Math.cos(B))*.9*r;if(!e.grounded||n.tuck>.05){const q=n.tuck;O=Pt(O,P.front?-.7:.9,q),j=Pt(j,P.front?1.4:-1.1,q)}P.hip.rotation.set(O-n.bodyPitch,0,P.side*.05),P.knee.rotation.set(P.front?j:-j*.6+(e.grounded,0),0,0),P.foot.rotation.set(-(O-n.bodyPitch)-(P.front?j:-j*.6),0,0)}const D=this.tail.length,I=e.glide?.05:.12*(1-r*.6);for(let P=0;P<D;P++){const B=this.tail[P],O=P/D;B.rotation.y=Math.sin(i*2.2-P*.55)*I+n.tailYaw*(.5+O*.5)/D*3,B.rotation.x=n.tailPitch/D*2+(P===0?.1:0)-(e.grounded?O*.02:0)}}}function Ia(a,t,e){return a<t?t:a>e?e:a}function Kr(a,t,e,i){return a<=t||a>=i?0:a<e?le(t,e,a):1-le(e,i,a)}function rc(a){return a<.5?2*a*a:1-Math.pow(-2*a+2,2)/2}const pi=Math.PI,yn={horn1:{id:"horn1",name:"Horn Jab",pose:"horn1",duration:.36,air:!1,cancelFrom:.16,hits:[{t0:.08,t1:.17,range:2,arc:.95,low:-.3,high:1.8,damage:10,knockback:3,launch:0,stagger:12,hitstop:.045}],lunge:[0,.14,7],next:{horn:"horn2",tail:"uppercut"},swooshes:[{t:.08,radius:1.8,arc:1.4,plane:"h",height:.8,tilt:.25}],sfx:"swing",sfxAt:.05,tracking:1,style:10},horn2:{id:"horn2",name:"Horn Sweep",pose:"horn2",duration:.4,air:!1,cancelFrom:.2,hits:[{t0:.1,t1:.22,range:2.2,arc:1.3,low:-.3,high:1.8,damage:12,knockback:3.5,launch:0,stagger:14,hitstop:.05}],lunge:[0,.16,7],next:{horn:"horn3",tail:"uppercut"},swooshes:[{t:.1,radius:2,arc:2.2,plane:"h",height:.85,tilt:-.2}],sfx:"swing",sfxAt:.07,tracking:1,style:12},horn3:{id:"horn3",name:"Horn Ram",pose:"horn3",duration:.56,air:!1,cancelFrom:.3,hits:[{t0:.14,t1:.27,range:2.3,arc:.9,low:-.3,high:1.9,damage:18,knockback:11,launch:2,stagger:35,hitstop:.09,heavy:!0}],lunge:[.05,.22,10],next:{horn:"horn4",tail:"tail3"},swooshes:[{t:.14,radius:2.1,arc:1.2,plane:"v",height:.2,start:-.2}],sfx:"swingHeavy",sfxAt:.1,tracking:1,style:18},horn4:{id:"horn4",name:"Horn Cyclone",pose:"horn4",duration:.62,air:!1,cancelFrom:.5,hits:[{t0:.1,t1:.25,range:2.6,arc:pi,low:-.3,high:1.9,damage:12,knockback:4,launch:0,stagger:18,hitstop:.04},{t0:.3,t1:.42,range:2.6,arc:pi,low:-.3,high:1.9,damage:16,knockback:10,launch:3,stagger:40,hitstop:.08,heavy:!0}],lunge:[0,.2,4],next:{},requires:"hornFinisher",swooshes:[{t:.1,radius:2.4,arc:pi*1.6,plane:"h",height:.7},{t:.3,radius:2.6,arc:pi*1.9,plane:"h",height:.8}],sfx:"swingHeavy",sfxAt:.08,tracking:.5,style:20},uppercut:{id:"uppercut",name:"Horn Toss",pose:"uppercut",duration:.58,air:!1,cancelFrom:.34,hits:[{t0:.16,t1:.3,range:2.1,arc:1,low:-.4,high:2.2,damage:12,knockback:1.2,launch:13.5,stagger:45,hitstop:.07}],lunge:[0,.14,5],next:{horn:"horn1"},swooshes:[{t:.16,radius:1.9,arc:2,plane:"v",height:.1,start:-.9,color:16770984}],sfx:"launch",sfxAt:.14,tracking:1,style:20},tail1:{id:"tail1",name:"Tail Whip",pose:"tail1",duration:.5,air:!1,cancelFrom:.28,hits:[{t0:.12,t1:.32,range:2.8,arc:pi,low:-.3,high:1.4,damage:13,knockback:7,launch:0,stagger:28,hitstop:.06,heavy:!0}],lunge:[0,.2,3],next:{tail:"tail2",horn:"horn2"},swooshes:[{t:.12,radius:2.6,arc:pi*1.7,plane:"h",height:.45,color:16773312}],sfx:"swingHeavy",sfxAt:.08,tracking:.6,style:14},tail2:{id:"tail2",name:"Tail Lash",pose:"tail2",duration:.5,air:!1,cancelFrom:.28,hits:[{t0:.12,t1:.32,range:2.8,arc:pi,low:-.3,high:1.4,damage:15,knockback:8,launch:0,stagger:30,hitstop:.06,heavy:!0}],lunge:[0,.2,3],next:{tail:"tail3",horn:"horn3"},swooshes:[{t:.12,radius:2.6,arc:pi*1.7,plane:"h",height:.5,color:16773312}],sfx:"swingHeavy",sfxAt:.08,tracking:.6,style:15},tail3:{id:"tail3",name:"Tail Smash",pose:"tail3",duration:.72,air:!1,cancelFrom:.55,hits:[{t0:.34,t1:.44,range:2.2,arc:.8,low:-.4,high:1.6,offset:.9,damage:26,knockback:5,launch:7,stagger:65,hitstop:.11,heavy:!0}],lunge:[0,.3,3],next:{},swooshes:[{t:.3,radius:2.3,arc:2.2,plane:"v",height:.2,start:-.4,color:16773312}],sfx:"swingHeavy",sfxAt:.28,tracking:1,style:24},tailSpin:{id:"tailSpin",name:"Tail Cyclone",pose:"tailSpin",duration:1.6,air:!1,cancelFrom:1.6,hits:[.1,.3,.5,.7,.9,1.1,1.3].map(a=>({t0:a,t1:a+.1,range:2.9,arc:pi,low:-.3,high:1.5,damage:6,knockback:2.5,launch:0,stagger:10,hitstop:.02})),next:{},requires:"tailSpin",swooshes:[.1,.3,.5,.7,.9,1.1,1.3].map(a=>({t:a,radius:2.7,arc:pi*1.8,plane:"h",height:.5,color:16773312})),sfx:"swingHeavy",sfxAt:.05,tracking:0,style:6},air1:{id:"air1",name:"Air Horn",pose:"air1",duration:.32,air:!0,hover:!0,cancelFrom:.14,hits:[{t0:.06,t1:.16,range:2.3,arc:1.1,low:-1.3,high:2.4,damage:10,knockback:1.2,launch:0,stagger:12,hitstop:.045,float:4}],lunge:[0,.12,5],next:{horn:"air2",tail:"slam"},swooshes:[{t:.06,radius:1.9,arc:1.8,plane:"h",height:.8,tilt:.35}],sfx:"swing",sfxAt:.04,tracking:1,style:14},air2:{id:"air2",name:"Air Sweep",pose:"air2",duration:.34,air:!0,hover:!0,cancelFrom:.16,hits:[{t0:.07,t1:.17,range:2.3,arc:1.2,low:-1.3,high:2.4,damage:11,knockback:1.2,launch:0,stagger:12,hitstop:.045,float:4}],lunge:[0,.12,5],next:{horn:"air3",tail:"slam"},swooshes:[{t:.07,radius:1.9,arc:1.9,plane:"h",height:.8,tilt:-.35}],sfx:"swing",sfxAt:.05,tracking:1,style:15},air3:{id:"air3",name:"Comet Flip",pose:"air3",duration:.5,air:!0,hover:!0,cancelFrom:.4,hits:[{t0:.16,t1:.3,range:2.4,arc:1.2,low:-1.5,high:2.4,damage:18,knockback:9,launch:0,stagger:45,hitstop:.09,heavy:!0,spike:!0}],lunge:[0,.15,4],next:{tail:"slam"},swooshes:[{t:.14,radius:2,arc:2.6,plane:"v",height:.4,start:1.2}],sfx:"swingHeavy",sfxAt:.12,tracking:1,style:22},ram:{id:"ram",name:"Horn Dash",pose:"horn3",duration:.46,air:!1,cancelFrom:.36,hits:[{t0:.04,t1:.3,range:1.9,arc:.8,low:-.3,high:1.8,damage:16,knockback:12,launch:3,stagger:50,hitstop:.08,heavy:!0}],lunge:[0,.3,15],next:{horn:"horn2",tail:"uppercut"},swooshes:[{t:.05,radius:1.8,arc:1.2,plane:"v",height:.3,start:-.3}],sfx:"swingHeavy",sfxAt:.02,tracking:1,style:18},counter:{id:"counter",name:"Counter",pose:"counter",duration:.6,air:!1,cancelFrom:.45,hits:[{t0:.16,t1:.36,range:3,arc:pi,low:-.5,high:2.4,damage:34,knockback:10,launch:6,stagger:80,hitstop:.13,heavy:!0}],lunge:[0,.18,12],next:{horn:"horn2",tail:"uppercut"},swooshes:[{t:.16,radius:2.8,arc:pi*1.9,plane:"h",height:.8,color:14267391}],sfx:"counter",sfxAt:.12,tracking:1,style:40}},oc={t0:0,t1:.1,range:3.4,arc:pi,low:-1,high:2,damage:20,knockback:7,launch:7,stagger:55,hitstop:.1,heavy:!0},jo=["fire","lightning","ice","earth"],Ax={fire:"Fire",lightning:"Lightning",ice:"Ice",earth:"Earth"};function ze(a){return{type:"physical",dirX:0,dirZ:1,knockback:0,launch:0,stagger:0,hitstop:0,buildup:0,heavy:!1,spike:!1,source:"melee",move:"hit",fromPlayer:!0,ox:0,oz:0,...a}}const Qa=[{id:"hornPower",tree:"horn",name:"Horn Strength",costs:[120,320,650],desc:["Melee damage +15%.","Melee damage +30%.","Melee damage +45%."]},{id:"hornFinisher",tree:"horn",name:"Horn Cyclone",costs:[220],desc:["A fourth Horn press ends the combo in a spinning strike that hits all around you."]},{id:"counter",tree:"horn",name:"Riposte",costs:[260],desc:["Perfect dodges slow time for longer, and Counter strikes deal 50% more damage."]},{id:"tailSpin",tree:"tail",name:"Tail Cyclone",costs:[200],desc:["Hold Tail on the ground to spin like a top, striking everything nearby."]},{id:"slamWave",tree:"tail",name:"Quake Pound",costs:[240],desc:["Ground Pound releases a shockwave that launches enemies into the air."]},{id:"ramBreaker",tree:"tail",name:"Battering Ram",costs:[180],desc:["Charging deals double damage and smashes through shields."]},{id:"airMastery",tree:"wings",name:"Aerial Artist",costs:[250],desc:["Air combos keep you aloft twice as long, and the air finisher hits harder."]},{id:"swiftWings",tree:"wings",name:"Swift Wings",costs:[200],desc:["A third wing flap, and gliding is 20% faster."]},{id:"dragonTime",tree:"wings",name:"Dragon Time",costs:[160,380],desc:["Dragon Time lasts 40% longer.","Dragon Time lasts 80% longer and refills faster."]},{id:"magnet",tree:"spirit",name:"Gem Lure",costs:[90,220],desc:["Gems fly to you from farther away.","Gems fly to you from much farther away."]},{id:"furyHeart",tree:"spirit",name:"Fury Heart",costs:[260],desc:["Fury builds 35% faster."]},{id:"manaFlow",tree:"spirit",name:"Mana Flow",costs:[200,450],desc:["Mana regenerates twice as fast.","Mana regenerates three times as fast."]}];for(const a of["fire","lightning","ice","earth"]){const t={fire:["Flame Breath","Fireball"],lightning:["Arc Breath","Storm Orb"],ice:["Frost Breath","Frost Nova"],earth:["Quake Breath","Boulder"]},[e,i]=t[a];Qa.push({id:`${a}Breath`,tree:a,element:a,name:e,costs:[0,260,560],desc:["Learned from the Warden.","Longer reach and 35% more damage.","Longest reach, 70% more damage, cheaper to sustain."]}),Qa.push({id:`${a}Burst`,tree:a,element:a,name:i,costs:[0,320,680],desc:Rx(a)})}function Rx(a){switch(a){case"fire":return["Hurl an exploding fireball.","Three fireballs in a fan.","Bigger explosions that leave the ground burning."];case"lightning":return["A slow orb that zaps everything near it.","The orb lives longer and zaps faster.","Two orbs, and each chains between targets."];case"ice":return["A ring of frost that chills everything around you.","Wider ring, freezes faster.","Ice spikes erupt from the ring."];case"earth":return["Launch a boulder that smashes on impact.","Heavier boulder, bigger impact.","The boulder splits into three on impact."]}}function Cx(a){const t=Qa.find(e=>e.id===a);if(!t)throw new Error(`unknown upgrade ${a}`);return t}const Sd={story:{enemyDamage:.5,enemyHp:.75,label:"Story",aggression:.7},normal:{enemyDamage:1,enemyHp:1,label:"Adventurer",aggression:1},hard:{enemyDamage:1.5,enemyHp:1.3,label:"Legend",aggression:1.35}};function ja(a="normal"){return{version:1,level:"fen",checkpoint:null,elements:[],upgrades:{},gems:0,heartShards:0,manaShards:0,found:{},levelsDone:{},unlocked:["fen"],difficulty:a,stats:{kills:0,bestCombo:0,playTime:0,deaths:0,reactions:0}}}function li(a,t){return a.upgrades[t]??0}function Td(a,t){const e=Cx(t),i=li(a,t);return i>=e.costs.length||e.element&&!a.elements.includes(e.element)?null:e.costs[i]}function Px(a,t){const e=Td(a,t);return e===null||a.gems<e?!1:(a.gems-=e,a.upgrades[t]=li(a,t)+1,!0)}function kx(a,t){a.elements.includes(t)||a.elements.push(t),a.upgrades[`${t}Breath`]=Math.max(1,li(a,`${t}Breath`)),a.upgrades[`${t}Burst`]=Math.max(1,li(a,`${t}Burst`))}const wn=4,Lx=100,Dx=100;function Ed(a){return Lx+Math.floor(a.heartShards/wn)*25}function Ad(a){return Dx+Math.floor(a.manaShards/wn)*25}const Rd="wyrmling.save.v1",Cd="wyrmling.options.v1";function tr(){try{const a=localStorage.getItem(Rd);if(!a)return null;const t=JSON.parse(a);return t.version!==1||typeof t.level!="string"?null:{...ja(t.difficulty),...t,stats:{...ja().stats,...t.stats}}}catch{return null}}function Pi(a){try{localStorage.setItem(Rd,JSON.stringify(a))}catch{}}function hc(){return{volume:.8,music:.55,sfx:.9,sensitivity:1,invertY:!1,quality:"high",shake:1,damageNumbers:!0,autoCamera:!0}}function Ix(){try{const a=localStorage.getItem(Cd);if(a)return{...hc(),...JSON.parse(a)}}catch{}return hc()}function Nx(a){try{localStorage.setItem(Cd,JSON.stringify(a))}catch{}}const Ux={fire:15,lightning:17,ice:14,earth:19},Fx={fire:22,lightning:30,ice:28,earth:30},zx={fire:"fire",lightning:"lightning",ice:"ice",earth:"earth"},vt=new C,ie=new C,fi=new C,Bx=new C,Ox=new C;class Hx{game;player;active=null;tick=0;spawn=0;arcT=0;sfxT=0;aimPitch=0;furyTick=0;furyCount=0;constructor(t,e){this.game=t,this.player=e}level(t){return Math.max(1,li(this.game.save,`${t}Breath`))}burstLevel(t){return Math.max(1,li(this.game.save,`${t}Burst`))}get costMul(){return this.active&&this.level(this.active)>=3?.75:1}start(t){this.active!==t&&(this.stop(),this.active=t,this.tick=0,this.spawn=0,this.game.audio.startLoop("breath",zx[t]))}stop(){this.active&&(this.active=null,this.game.audio.stopLoop("breath"),this.aimPitch=0)}computeAim(t){const e=this.player;e.mouth(vt);const i=e.lock??e.findTarget(t+2,!1);if(i){fi.set(i.x,i.y+i.height*.5,i.z).sub(vt);const s=Math.hypot(fi.x,fi.z),r=Math.max(-.7,Math.min(.9,Math.atan2(fi.y,s)));this.aimPitch+=(r-this.aimPitch)*.3}else this.aimPitch+=(-.08-this.aimPitch)*.3;const n=Math.cos(this.aimPitch);return ie.set(Math.sin(e.yaw)*n,Math.sin(this.aimPitch),Math.cos(e.yaw)*n).normalize(),i}update(t){const e=this.active;if(!e)return;const i=this.game,n=this.level(e),s=n===1?1:n===2?1.35:1.7;switch(this.tick-=t,this.spawn-=t,this.sfxT-=t,e){case"fire":{const r=5.5+(n-1)*1.4;this.computeAim(r),i.fx.emit(vt.x,vt.y,vt.z,{count:5,speed:r*2.6,speedJitter:.25,dir:[ie.x,ie.y,ie.z],spread:.13,life:[.28,.4],size:[.25,.4],sizeEnd:5,color:16769674,colorEnd:16726536,bright:2,drag:1.2,gravity:-2}),nt.chance(.25)&&i.fx.emit(vt.x+ie.x*r*.7,vt.y+ie.y*r*.7+.5,vt.z+ie.z*r*.7,{count:1,speed:1,dir:[0,1,0],life:[.5,.9],size:[.8,1.2],sizeEnd:2.5,color:3813424,alpha:.35,additive:!1,gravity:-2}),i.fx.flash(vt.x+ie.x,vt.y,vt.z+ie.z,16747056,3+nt.next(),9,.12),this.tick<=0&&(this.tick=.1,this.coneHits(r,.42,{damage:2.4*s,type:"fire",buildup:9,knockback:.8,stagger:3,move:"fireBreath"}));break}case"lightning":{const r=9+(n-1)*1.5;this.computeAim(r);const o=1+n;if(this.arcT-=t,this.tick<=0||this.arcT<=0){const h=this.tick<=0;h&&(this.tick=.12),this.arcT=.05;const l=this.coneTargets(r,.55,o);let c=Bx.copy(vt);if(l.length===0){const u=Ox.copy(vt).addScaledVector(ie,r*(.7+nt.next()*.3));u.x+=nt.signed()*.8,u.y+=nt.signed()*.5,u.z+=nt.signed()*.8;const d=i.col.raycast(vt.x,vt.y,vt.z,ie.x,ie.y,ie.z,r);d.t<r&&u.copy(vt).addScaledVector(ie,d.t),i.fx.arc(vt,u,12577023,.08,.07,.45),d.t<r&&i.fx.sparkle(u.x,u.y,u.z,12577023,3)}for(const u of l){const d=new C(u.x,u.y+u.height*.55,u.z);if(i.fx.arc(c,d,13627647,.12,.07,.35),i.fx.arc(c,d,8046847,.05,.07,.6),h){const f=u.x-this.player.x,m=u.z-this.player.z,v=Math.hypot(f,m)||1,p=u.takeHit(ze({damage:3*s,type:"lightning",buildup:12,dirX:f/v,dirZ:m/v,knockback:.4,stagger:4,source:"breath",move:"arcBreath",ox:this.player.x,oz:this.player.z}));this.player.onDealt(p,u,3*s,"arcBreath",3),i.fx.sparkle(d.x,d.y,d.z,13627647,3)}c=d}i.fx.flash(vt.x,vt.y,vt.z,10475775,3,10,.08),this.sfxT<=0&&(this.sfxT=.09,i.sfx("zap",vt.x,vt.y,vt.z,.8+nt.next()*.5,.6))}break}case"ice":{const r=9+(n-1)*1.5;if(this.computeAim(r),this.spawn<=0){this.spawn=.065;const o=ie.x+nt.signed()*.07,h=ie.y+nt.signed()*.05,l=ie.z+nt.signed()*.07;i.spawnProjectile({x:vt.x,y:vt.y,z:vt.z,dx:o,dy:h,dz:l,speed:24,radius:.28,damage:3*s,type:"ice",color:13629183,life:r/24,gravity:0,fromPlayer:!0,kind:"shard",buildup:11,knockback:.6,stagger:3,move:"frostBreath"})}i.fx.emit(vt.x,vt.y,vt.z,{count:3,speed:9,dir:[ie.x,ie.y,ie.z],spread:.18,life:[.3,.5],size:[.3,.5],sizeEnd:3.5,color:15268863,colorEnd:9427199,alpha:.35,additive:!1,drag:2}),i.fx.emit(vt.x,vt.y,vt.z,{count:2,speed:12,dir:[ie.x,ie.y,ie.z],spread:.15,life:[.2,.4],size:[.08,.15],color:16777215,bright:1.5});break}case"earth":{const r=4.6+(n-1)*1;this.computeAim(r),i.fx.emit(vt.x,vt.y,vt.z,{count:4,speed:r*3,dir:[ie.x,ie.y,ie.z],spread:.2,life:[.2,.35],size:[.14,.28],sizeEnd:.8,color:10126946,colorEnd:6969914,additive:!1,gravity:10,drag:1}),i.fx.emit(vt.x,vt.y,vt.z,{count:2,speed:r*2,dir:[ie.x,ie.y,ie.z],spread:.25,life:[.3,.5],size:[.5,.8],sizeEnd:3,color:13154448,alpha:.4,additive:!1,drag:2.5}),i.fx.emit(vt.x,vt.y,vt.z,{count:2,speed:r*2.5,dir:[ie.x,ie.y,ie.z],spread:.2,life:[.15,.3],size:[.15,.25],color:12120186,bright:1.5}),this.tick<=0&&(this.tick=.12,this.coneHits(r,.5,{damage:3.4*s,type:"earth",buildup:0,knockback:3,stagger:13,move:"quakeBreath"}),i.shake(.05,.1));break}}}coneTargets(t,e,i){const n=[];for(const s of this.game.hittables()){if(!s.alive)continue;fi.set(s.x,s.y+s.height*.5,s.z).sub(vt);const r=fi.length();if(r>t+s.radius)continue;const o=ie.angleTo(fi),h=Math.atan2(s.radius+s.height*.3,Math.max(.5,r));o>e+h||n.push({h:s,d:r})}return n.sort((s,r)=>s.d-r.d),n.slice(0,i).map(s=>s.h)}coneHits(t,e,i){const n=this.player;for(const s of this.coneTargets(t,e,12)){fi.set(s.x,s.y+s.height*.5,s.z).sub(vt);const r=fi.length();if(fi.normalize(),this.game.col.raycast(vt.x,vt.y,vt.z,fi.x,fi.y,fi.z,Math.max(0,r-s.radius-.3),!0).t<r-s.radius-.3)continue;const h=s.x-n.x,l=s.z-n.z,c=Math.hypot(h,l)||1,u=s.takeHit(ze({damage:i.damage,type:i.type,buildup:i.buildup,dirX:h/c,dirZ:l/c,knockback:i.knockback,stagger:i.stagger,source:"breath",move:i.move,ox:n.x,oz:n.z}));n.onDealt(u,s,i.damage,i.move,3)}}burst(t,e){const i=this.game,n=this.player,s=this.burstLevel(t);n.mouth(vt);const r=n.yaw;let o=.02;if(e){const l=Math.hypot(e.x-vt.x,e.z-vt.z);o=Math.atan2(e.y+e.height*.5-vt.y,l)}const h=(l,c=o)=>({dx:Math.sin(l)*Math.cos(c),dy:Math.sin(c),dz:Math.cos(l)*Math.cos(c)});switch(t){case"fire":{const l=s>=2?3:1;for(let c=0;c<l;c++){const u=r+(l===1?0:(c-1)*.22);i.spawnProjectile({x:vt.x,y:vt.y,z:vt.z,...h(u),speed:24,radius:.5,damage:26,type:"fire",color:16747056,life:1.6,gravity:0,fromPlayer:!0,kind:"fireball",explode:s>=3?4:3,buildup:60,knockback:9,launch:4,stagger:30,move:"fireball",burnGround:s>=3,homing:e?1.5:0})}i.sfx("fireBurst",vt.x,vt.y,vt.z),i.fx.flash(vt.x,vt.y,vt.z,16747056,8,12,.25);break}case"lightning":{const l=s>=3?2:1;for(let c=0;c<l;c++){const u=r+(l===1?0:(c-.5)*.5);i.spawnProjectile({x:vt.x,y:vt.y+.2,z:vt.z,...h(u,Math.max(o,0)),speed:6,radius:.55,damage:12,type:"lightning",color:10477823,life:s>=2?5:3.5,gravity:0,fromPlayer:!0,kind:"stormOrb",pierce:!0,buildup:30,knockback:2,stagger:10,move:"stormOrb",explode:3,zap:{radius:4.5,interval:s>=2?.2:.3,damage:6,buildup:22,chains:s>=3?5:3}})}i.sfx("zap",vt.x,vt.y,vt.z,.6);break}case"ice":{const l=s>=2?6.5:4.8,c=n.x,u=n.y,d=n.z;for(const f of i.hittables()){if(!f.alive)continue;const m=f.x-c,v=f.z-d,p=Math.hypot(m,v);if(p-f.radius>l||Math.abs(f.y-u)>3)continue;const g=p||1,y=s>=3?24:14,b=f.takeHit(ze({damage:y,type:"ice",buildup:s>=2?100:70,dirX:m/g,dirZ:v/g,knockback:4,stagger:20,source:"burst",move:"frostNova",ox:c,oz:d}));n.onDealt(b,f,y,"frostNova",10)}i.fx.ring(c,u,d,.5,l,12580095,.45),i.fx.ring(c,u+.4,d,.3,l*.8,16777215,.35),i.fx.emit(c,u+.5,d,{count:60,speed:l*2.2,dir:[0,.15,0],spread:1,life:[.35,.6],size:[.3,.6],sizeEnd:2,color:15268863,colorEnd:9427199,alpha:.6,additive:!1,drag:3}),i.fx.emit(c,u+.3,d,{count:30,speed:l*2,dir:[0,.3,0],spread:1,life:[.3,.6],size:[.1,.2],color:16777215,bright:2,drag:2}),s>=3&&i.spawnIceSpikes(c,u,d,l),i.sfx("iceCrack",c,u,d,.8),i.sfx("shatter",c,u,d,1.4,.4),i.shake(.2,.2);break}case"earth":{i.spawnProjectile({x:vt.x,y:vt.y+.2,z:vt.z,...h(r,Math.max(o+.12,.1)),speed:19,radius:s>=2?.75:.6,damage:s>=2?44:34,type:"earth",color:10126946,life:2.2,gravity:13,fromPlayer:!0,kind:"boulder",explode:s>=2?4:3.2,heavy:!0,stagger:90,knockback:12,launch:7,move:"boulder",split:s>=3?3:0}),i.sfx("rumble",vt.x,vt.y,vt.z,1.3,.6);break}}}furyStart(t){const e=this.game;this.furyTick=0,this.furyCount=0,e.slowmo(.4,2.6),e.cam.furyZoom(2.7);const i=this.player,n=t==="fire"?16740384:t==="lightning"?11069183:t==="ice"?12580095:10215530;e.fx.ring(i.x,i.y,i.z,.5,6,n,.8),e.fx.motes(i.x,i.y+1,i.z,n,40)}furyUpdate(t,e,i){const n=this.game,s=this.player,r=s.x,o=s.y,h=s.z;this.furyTick-=i;const l=t==="fire"?16740384:t==="lightning"?11069183:t==="ice"?12580095:10215530;if(e<.6){n.fx.emit(r,o+1,h,{count:4,speed:5,life:[.3,.6],size:[.3,.5],color:l,bright:2,drag:1,jitter:1.5});return}const c=(u,d,f,m,v,p)=>{for(const g of n.hittables()){if(!g.alive)continue;const y=g.x-r,b=g.z-h,x=Math.hypot(y,b);if(x>u+g.radius||Math.abs(g.y-o)>8)continue;const S=x||1,T=g.takeHit(ze({damage:d,type:t,buildup:f,dirX:y/S,dirZ:b/S,knockback:v,launch:m,stagger:80,heavy:!0,source:"fury",move:p,ox:r,oz:h}));s.onDealt(T,g,d,p,5)}};switch(t){case"fire":if(this.furyTick<=0&&this.furyCount<4){this.furyTick=.42,this.furyCount++;const u=5+this.furyCount*3;c(u,40,100,5,8,"inferno"),n.fx.ring(r,o,h,1,u,16740384,.5),n.fx.explosion(r,o+1,h,3,16752704);for(let d=0;d<24;d++){const f=d/24*Math.PI*2;n.fx.emit(r+Math.sin(f)*u*.6,o+.5,h+Math.cos(f)*u*.6,{count:3,speed:6,dir:[Math.sin(f),.4,Math.cos(f)],spread:.3,life:[.4,.7],size:[.8,1.2],sizeEnd:.3,color:16760928,colorEnd:16719872,bright:2})}n.sfx("explosion",r,o,h,.9),n.shake(.5,.35)}break;case"lightning":if(this.furyTick<=0&&e<2.4){this.furyTick=.13;const u=n.enemies.filter(y=>y.alive&&Math.hypot(y.x-r,y.z-h)<20);let d,f,m;const v=u.length?u[Math.floor(nt.next()*u.length)]:null;if(v)d=v.x,f=v.y+v.height*.5,m=v.z;else{const y=nt.next()*Math.PI*2,b=3+nt.next()*12;d=r+Math.sin(y)*b,m=h+Math.cos(y)*b,f=n.col.groundAt(d,m,o+5,.1).y}const p=new C(d+nt.signed()*2,f+18,m+nt.signed()*2),g=new C(d,f,m);if(n.fx.arc(p,g,14743295,.35,.18,.25),n.fx.arc(p,g,8046847,.15,.2,.4),n.fx.flash(d,f+2,m,12577023,10,16,.2),n.fx.ring(d,f,m,.3,3,12577023,.3),n.sfx("zap",d,f,m,.5,1),v){const y=v.x-r,b=v.z-h,x=Math.hypot(y,b)||1,S=v.takeHit(ze({damage:26,type:"lightning",buildup:60,dirX:y/x,dirZ:b/x,knockback:2,stagger:40,source:"fury",move:"tempest",ox:r,oz:h}));s.onDealt(S,v,26,"tempest",5)}}break;case"ice":n.fx.emit(r,o+3,h,{count:10,speed:12,dir:[0,-.2,0],spread:1,life:[.8,1.4],size:[.15,.3],sizeEnd:1,color:16777215,alpha:.9,additive:!1,jitter:8,drag:.5}),n.fx.emit(r,o+1,h,{count:4,speed:8,dir:[0,.1,0],spread:1,life:[.6,1],size:[1,2],sizeEnd:3,color:15268863,alpha:.25,additive:!1,jitter:6}),this.furyTick<=0&&this.furyCount<4&&(this.furyTick=.45,this.furyCount++,c(16,22,this.furyCount>=3?200:45,0,2,"blizzard"),n.fx.ring(r,o,h,1,16,12580095,.6),n.sfx("iceCrack",r,o,h,.7));break;case"earth":if(this.furyTick<=0&&this.furyCount<4){this.furyTick=.45,this.furyCount++,c(15,36,0,9,10,"cataclysm"),n.fx.ring(r,o,h,1,15,13154448,.5);for(let u=0;u<14;u++){const d=nt.next()*Math.PI*2,f=2+nt.next()*12,m=r+Math.sin(d)*f,v=h+Math.cos(d)*f;n.fx.rocks(m,n.col.groundAt(m,v,o+5,.1).y+.2,v,6)}n.sfx("rumble",r,o,h,.7,1),n.sfx("pound",r,o,h),n.shake(.7,.4)}break}}}const Na=8.8,Gx=65,Vx=50,Wx=30,Jr=32,Ua=11.5,Xx=10.2,qx=11.5,lc=15,Qr=15.5,jr=.32,Yx=.13,Pd=new ys(.55,20);Pd.rotateX(-Math.PI/2);class $x{game;body=new wd(.48,1.25);rig=new Ph(bd);pose=Ch();breath;yaw=0;state="move";stateT=0;hp=100;mana=100;fury=0;dtime=100;element=null;alive=!0;hidden=!1;invuln=!1;iframes=0;jumps=0;coyote=0;airTime=0;airBudget=1.6;airDashUsed=!1;gliding=!1;move=null;moveT=0;hitSets=[];swooshDone=[];sfxDone=!1;moveHits=0;followLaunch=!1;counterWindow=0;dodgeX=0;dodgeZ=1;perfectUsed=!1;slamLanded=!1;target=null;lock=null;hurtT=0;lastSafe=new C;safeT=0;dtimeIdle=0;dragonTimeActive=!1;ramCooldown=new Map;tailHeld=0;blob;blobMat;lastGroundedY=0;wadeFx=0;flashT=0;inWater=!1;lastCombat=-99;constructor(t){this.game=t,this.breath=new Hx(t,this),t.scene.add(this.rig.root),this.rig.root.traverse(e=>{e.isMesh&&(e.castShadow=!0)}),this.blobMat=new si({color:0,transparent:!0,opacity:.35,depthWrite:!1}),this.blob=new J(Pd,this.blobMat),this.blob.renderOrder=2,t.scene.add(this.blob)}get maxHp(){return Ed(this.game.save)}get maxMana(){return Ad(this.game.save)}get dtimeMax(){return 100*(1+.4*li(this.game.save,"dragonTime"))}get magnetRadius(){return 3.5+li(this.game.save,"magnet")*3}get meleeMult(){return 1+.15*li(this.game.save,"hornPower")}hasUpgrade(t){return li(this.game.save,t)>0}get elements(){return this.game.save.elements}get x(){return this.body.x}get y(){return this.body.y}get z(){return this.body.z}mouth(t){return this.rig.mouth.getWorldPosition(t),t}place(t,e,i,n){this.body.setPos(t,e,i),this.body.vx=this.body.vy=this.body.vz=0,this.body.grounded=!1,this.yaw=n,this.lastSafe.set(t,e,i),this.syncRig(0)}resetForLevel(){this.hp=this.maxHp,this.mana=this.maxMana,this.dtime=this.dtimeMax,this.alive=!0,this.state="move",this.stateT=0,this.move=null,this.lock=null,this.target=null,this.iframes=0,this.gliding=!1,this.breath.stop(),this.rig.setFlash(0),this.rig.setOpacity(1),!this.element&&this.elements.length&&(this.element=this.elements[0])}setState(t){this.state==="breath"&&t!=="breath"&&this.breath.stop(),this.state==="charge"&&t!=="charge"&&this.game.audio.stopLoop("charge"),this.state=t,this.stateT=0}wish(t){const e=this.game.input,i=this.game.cam.yaw,n=Math.sin(i),s=Math.cos(i),r=-Math.cos(i),o=Math.sin(i);t.x=n*e.moveY+r*e.moveX,t.z=s*e.moveY+o*e.moveX;const h=Math.hypot(t.x,t.z);return h>1?(t.x/=h,t.z/=h,1):h}w={x:0,z:0};update(t){const e=this.game,i=this.body;this.stateT+=t,this.iframes=Math.max(0,this.iframes-t),this.counterWindow=Math.max(0,this.counterWindow-t),this.hurtT=Math.max(0,this.hurtT-t),this.flashT=Math.max(0,this.flashT-t);for(const[r,o]of this.ramCooldown)o-t<=0?this.ramCooldown.delete(r):this.ramCooldown.set(r,o-t);if(this.state==="dead"){this.gravity(t,1),this.friction(t,8),e.col.move(i,t),this.syncRig(t);return}if(this.state==="fall"){this.syncRig(t);return}switch(e.col.carry(i),this.state!=="locked"&&this.handleMeta(t),this.state){case"move":this.updateMove(t);break;case"attack":this.updateAttack(t);break;case"slam":this.updateSlam(t);break;case"dodge":this.updateDodge(t);break;case"charge":this.updateCharge(t);break;case"breath":this.updateBreath(t);break;case"burst":this.updateBurst(t);break;case"fury":this.updateFury(t);break;case"hurt":case"down":this.gravity(t,1),this.friction(t,i.grounded?9:1),this.stateT>(this.state==="down"?.75:.32)&&this.setState("move");break;case"locked":this.gravity(t,1),this.friction(t,14);break}const n=i.grounded,s=i.vy;e.col.move(i,t),i.grounded?(n||this.onLand(s),this.coyote=Yx,this.airTime=0,this.jumps=0,this.airDashUsed=!1,this.gliding=!1,this.airBudget=this.hasUpgrade("airMastery")?3.2:1.6,this.lastGroundedY=i.y):(this.coyote=Math.max(0,this.coyote-t),this.airTime+=t),this.pushOffEnemies(),this.water(t),this.trackSafeGround(t),i.y<e.killY&&e.playerFell(),this.regen(t),this.syncRig(t)}handleMeta(t){const e=this.game,i=e.input,n=this.elements;if(n.length){let r=null;i.take("elem1",.2)&&n.includes("fire")&&(r="fire"),i.take("elem2",.2)&&n.includes("lightning")&&(r="lightning"),i.take("elem3",.2)&&n.includes("ice")&&(r="ice"),i.take("elem4",.2)&&n.includes("earth")&&(r="earth");const o=i.wheel!==0?Math.sign(i.wheel):i.take("elemNext",.2)?1:0;if(o!==0){const h=jo.filter(c=>n.includes(c)),l=Math.max(0,h.indexOf(this.element??h[0]));r=h[(l+o+h.length)%h.length]}r&&r!==this.element&&(this.element=r,e.audio.play("ui",1.3),e.hud.elementChanged(r),this.state==="breath"&&this.breath.start(r))}if(i.take("lock",.2))if(this.lock)this.lock=null;else{const r=this.findTarget(22,!0);this.lock=r&&r.isEnemy?r:null}this.lock&&(!this.lock.alive||Math.hypot(this.lock.x-this.body.x,this.lock.z-this.body.z)>30)&&(this.lock=null);const s=i.down("dragonTime")&&this.state!=="fury";if(s&&!this.dragonTimeActive&&this.dtime>12?(this.dragonTimeActive=!0,e.audio.play("dragonTimeOn")):this.dragonTimeActive&&(!s||this.dtime<=0)&&(this.dragonTimeActive=!1,e.audio.play("dragonTimeOff")),this.dragonTimeActive)this.dtime=Math.max(0,this.dtime-24*t),this.dtimeIdle=0;else{this.dtimeIdle+=t;const r=li(e.save,"dragonTime");this.dtimeIdle>1.2&&(this.dtime=Math.min(this.dtimeMax,this.dtime+(9+(r>=2?6:0))*t))}i.take("fury",.2)&&this.fury>=100&&this.element&&this.state!=="fury"&&this.startFury()}regen(t){if(this.state!=="breath"){const e=1+li(this.game.save,"manaFlow");this.mana=Math.min(this.maxMana,this.mana+2.2*e*t)}}gravity(t,e){const i=this.body,n=i.vy<0?Jr*1.15:Jr;i.vy=Math.max(-32,i.vy-n*e*t)}friction(t,e){const i=Math.exp(-e*t);this.body.vx*=i,this.body.vz*=i}steer(t,e,i,n){const s=this.body,r=this.wish(this.w),o=this.w.x*e,h=this.w.z*e,l=o-s.vx,c=h-s.vz,u=Math.hypot(l,c),d=(r>.05?i:Vx)*t;return u<=d?(s.vx=o,s.vz=h):(s.vx+=l/u*d,s.vz+=c/u*d),r>.1&&(this.yaw=Xi(this.yaw,Ee(this.w.x,this.w.z),n*t)),r}updateMove(t){const e=this.game,i=e.input,n=this.body,s=n.grounded,r=this.inWater?.62:1;if(s)this.steer(t,Na*r,Gx,lc),this.gravity(t,1);else if(this.gliding){this.wish(this.w)>.1&&(this.yaw=Xi(this.yaw,Ee(this.w.x,this.w.z),2.6*t));const l=qx*(this.hasUpgrade("swiftWings")?1.2:1),c=1-Math.exp(-4*t);n.vx+=(Math.sin(this.yaw)*l-n.vx)*c,n.vz+=(Math.cos(this.yaw)*l-n.vz)*c;const u=e.updraftAt(n.x,n.y,n.z);u>0?n.vy=Math.min(9,n.vy+u*t):n.vy=Math.max(-2.1,n.vy-Jr*.2*t),i.down("jump")||(this.gliding=!1)}else this.steer(t,Na*.95,Wx,lc*.6),this.gravity(t,1),i.released("jump")&&n.vy>4&&this.jumps===1&&(n.vy*=.5);const o=this.hasUpgrade("swiftWings")?3:2;if(i.buffered("jump",.12))if(s||this.coyote>0)i.consume("jump"),n.vy=Ua,this.jumps=1,this.coyote=0,n.grounded=!1,e.sfx("jump");else if(this.jumps<o&&!this.gliding){if(i.consume("jump"),n.vy=Xx,this.jumps=Math.max(2,this.jumps+1),this.pose.flapT=0,e.sfx("flap"),e.fx.dust(n.x,n.y,n.z,3,16777215),this.wish(this.w)>.1){const l=Math.max(Math.hypot(n.vx,n.vz),Na*.8);n.vx=this.w.x*l,n.vz=this.w.z*l}}else this.jumps>=2&&!this.gliding&&(i.consume("jump"),this.gliding=!0);!s&&!this.gliding&&this.jumps>=2&&i.down("jump")&&n.vy<0&&i.heldFor("jump")>.18&&(this.gliding=!0),this.actions(t)}actions(t){const e=this.game,i=e.input,s=!this.body.grounded;if(i.take("dodge",.12)){this.startDodge();return}if(i.take("horn",.15)){this.counterWindow>0&&!s?this.startMove(yn.counter):this.startMove(s?yn.air1:yn.horn1);return}if(i.take("tail",.15)){s?this.startSlam():(this.tailHeld=0,this.startMove(yn.tail1));return}if(i.down("breath")&&this.element&&this.mana>2){this.setState("breath"),this.breath.start(this.element);return}if(i.take("burst",.15)&&this.element){const r=Fx[this.element];if(this.mana>=r){this.mana-=r,this.setState("burst"),this.gliding=!1;return}e.toast("Not enough mana","warn"),e.hud.flashMana()}}onLand(t){const e=this.game,i=this.body;t<-8&&(e.sfx("land",i.x,i.y,i.z,1,Math.min(1,-t/20)),e.fx.dust(i.x,i.y,i.z,6)),this.gliding=!1}startDodge(){const t=this.game,e=this.body;if(this.wish(this.w)>.1?(this.dodgeX=this.w.x,this.dodgeZ=this.w.z):(this.dodgeX=-Math.sin(this.yaw),this.dodgeZ=-Math.cos(this.yaw)),!e.grounded){if(this.airDashUsed)return;this.airDashUsed=!0,e.vy=Math.max(e.vy,3)}this.state==="breath"&&this.breath.stop(),this.move=null,this.gliding=!1,this.perfectUsed=!1,this.setState("dodge"),this.iframes=.26,t.sfx("dodge")}updateDodge(t){const e=this.body,i=this.stateT/jr,n=17*(1-i)+4;e.vx=this.dodgeX*n,e.vz=this.dodgeZ*n,e.grounded&&(e.vy=0),this.gravity(t,e.grounded?1:.4),i>.2&&this.game.fx.emit(e.x,e.y+.6,e.z,{count:1,speed:.3,life:[.2,.3],size:[.6,.8],color:10121471,bright:.6,alpha:.5}),this.stateT>=jr&&(this.game.input.down("dodge")&&e.grounded?(this.setState("charge"),this.game.audio.startLoop("charge","charge"),this.game.sfx("charge")):this.setState("move"))}onEvaded(){const t=this.game;if(this.perfectUsed||this.state!=="dodge"||this.stateT>.24)return;this.perfectUsed=!0;const e=this.hasUpgrade("counter");this.counterWindow=e?1.6:1,t.slowmo(.25,e?1.3:.8),t.sfx("perfect"),t.toast("Perfect dodge! Horn to counter","good"),t.style.bonus(60),this.dtime=Math.min(this.dtimeMax,this.dtime+10);const i=this.body;t.fx.ring(i.x,i.y,i.z,.5,4,13214463,.5),t.fx.motes(i.x,i.y+.8,i.z,13676799,16),t.hud.perfect()}updateCharge(t){const e=this.game,i=e.input,n=this.body;this.wish(this.w)>.1&&(this.yaw=Xi(this.yaw,Ee(this.w.x,this.w.z),3.4*t));const r=1-Math.exp(-8*t);n.vx+=(Math.sin(this.yaw)*Qr-n.vx)*r,n.vz+=(Math.cos(this.yaw)*Qr-n.vz)*r,this.gravity(t,1),this.stateT%.08<t&&e.fx.dust(n.x-Math.sin(this.yaw)*.6,n.y,n.z-Math.cos(this.yaw)*.6,2);const o=this.hasUpgrade("ramBreaker")?2:1;for(const h of e.hittables()){if(!h.alive||this.ramCooldown.has(h))continue;const l=h.x-n.x,c=h.z-n.z,u=Math.hypot(l,c);if(u>h.radius+n.radius+.7||Math.abs(Vi(this.yaw,Ee(l,c)))>.9||h.y>n.y+1.8||h.y+h.height<n.y)continue;this.ramCooldown.set(h,.6);const d=h.takeHit(ze({damage:8*o*this.meleeMult,dirX:l/(u||1),dirZ:c/(u||1),knockback:12,launch:3,stagger:40,hitstop:.06,heavy:o>1,source:"charge",move:"charge",ox:n.x,oz:n.z}));this.onDealt(d,h,8*o,"charge",12)}if(n.hitWall&&Math.hypot(n.vx,n.vz)<Qr*.5&&this.stateT>.2){e.shake(.25,.2),e.sfx("hitHeavy",n.x,n.y,n.z,.7,.6),n.vx=-Math.sin(this.yaw)*4,n.vz=-Math.cos(this.yaw)*4,this.setState("hurt");return}if(i.take("horn",.15)){this.startMove(yn.ram);return}if(i.take("jump",.12)&&n.grounded){n.vy=Ua*.95,this.jumps=1,e.sfx("jump"),this.setState("move");return}(!i.down("dodge")||!n.grounded&&this.stateT>.1)&&this.setState("move")}startMove(t){const e=this.game,i=this.body;if(t.requires&&!this.hasUpgrade(t.requires))return;this.move=t,this.moveT=0,this.moveHits=0,this.hitSets=t.hits.map(()=>new Set),this.swooshDone=t.swooshes.map(()=>!1),this.sfxDone=!1,this.followLaunch=!1,this.gliding=!1,this.setState("attack");const n=this.findTarget(6.5,!1);if(this.target=n,n&&t.tracking>0){const s=Ee(n.x-i.x,n.z-i.z),r=Vi(this.yaw,s);this.yaw+=r*Math.min(1,t.tracking)}else this.wish(this.w)>.2&&(this.yaw=Ee(this.w.x,this.w.z));t.air?this.airBudget>0&&(i.vy=Math.max(i.vy*.3,1.2)):(i.vx*=.3,i.vz*=.3),t.id==="counter"&&(e.slowmo(.4,.35),this.counterWindow=0)}updateAttack(t){const e=this.game,i=e.input,n=this.body,s=this.move;this.moveT+=t;const r=this.moveT;let o=!1;if(s.lunge&&r>=s.lunge[0]&&r<=s.lunge[1]){let h=s.lunge[2];if(this.target&&this.target.alive){const l=Math.hypot(this.target.x-n.x,this.target.z-n.z)-this.target.radius-n.radius;l<.5?h=0:h=Math.min(h,l/Math.max(.05,s.lunge[1]-r)+1)}n.vx=Math.sin(this.yaw)*h,n.vz=Math.cos(this.yaw)*h,o=!0}if(o||this.friction(t,n.grounded?14:3),s.air&&this.airBudget>0?(this.airBudget-=t,n.vy=Math.max(n.vy-5*t,-.8)):this.gravity(t,1),!s.air&&!n.grounded&&r>.1&&s.id!=="uppercut"){this.setState("move");return}if(s.air&&n.grounded&&r>.05){this.setState("move");return}if(!this.sfxDone&&r>=s.sfxAt&&(this.sfxDone=!0,e.sfx(s.sfx,n.x,n.y,n.z,.95+Math.random()*.1)),s.swooshes.forEach((h,l)=>{if(!this.swooshDone[l]&&r>=h.t){this.swooshDone[l]=!0;const c=s.pose==="tail1"||s.pose==="tail2"||s.pose==="horn4"||s.pose==="tailSpin"||s.pose==="counter";e.fx.swoosh(n.x,n.y+h.height,n.z,this.yaw+(c?Math.PI:0),h.radius,h.arc,h.color??16774880,h.plane,h.tilt??0,.16,.5,h.start)}}),s.hits.forEach((h,l)=>{r>=h.t0&&r<=h.t1&&this.checkWindow(h,this.hitSets[l],s)}),(s.id==="horn1"||s.id==="horn2"||s.id==="air1"||s.id==="air2"||s.id==="horn3")&&this.reflectProjectiles(s),s.id==="uppercut"&&this.moveHits>0&&!this.followLaunch&&r>=.24&&(i.down("jump")||i.buffered("jump",.4))){i.consume("jump"),this.followLaunch=!0,n.vy=13.5,n.grounded=!1,this.jumps=1,this.airBudget=this.hasUpgrade("airMastery")?3.2:1.6,e.sfx("flap"),this.pose.flapT=0,this.setState("move");return}if(s.id==="tail1"&&(i.down("tail")&&(this.tailHeld+=t),this.tailHeld>.3&&this.hasUpgrade("tailSpin"))){this.startMove(yn.tailSpin);return}if(s.id==="tailSpin"&&(this.steer(t,3.5,20,0),!i.down("tail")&&r>.4)){this.setState("move");return}if(r>=s.cancelFrom){if(i.take("dodge",.2)){this.startDodge();return}const h=!n.grounded;if(i.buffered("horn",.4)&&s.next.horn){const l=yn[s.next.horn];if((!l.requires||this.hasUpgrade(l.requires))&&(l.air===h||s.id==="uppercut")){i.consume("horn"),this.startMove(l);return}}if(i.buffered("tail",.4)&&s.next.tail){i.consume("tail"),s.next.tail==="slam"?this.startSlam():this.startMove(yn[s.next.tail]);return}if(i.down("breath")&&this.element&&this.mana>2&&r>=s.cancelFrom+.05){this.setState("breath"),this.breath.start(this.element);return}}r>=s.duration&&(this.move=null,this.setState("move"))}checkWindow(t,e,i){const n=this.game,s=this.body,r=Math.sin(this.yaw),o=Math.cos(this.yaw),h=s.x+r*(t.offset??0),l=s.z+o*(t.offset??0),c=i.id==="counter"&&this.hasUpgrade("counter")?1.5:1;for(const u of n.hittables()){if(!u.alive||e.has(u))continue;const d=u.x-h,f=u.z-l,m=Math.hypot(d,f);if(m-u.radius>t.range||u.y>s.y+t.high||u.y+u.height<s.y+t.low||t.arc<Math.PI-.01&&m>u.radius+.5&&Math.abs(Vi(this.yaw,Ee(d,f)))>t.arc)continue;e.add(u);const v=m||1,p=t.damage*this.meleeMult*c,g=ze({damage:p,dirX:d/v,dirZ:f/v,knockback:t.knockback,launch:t.launch,stagger:t.stagger,hitstop:t.hitstop,heavy:t.heavy??!1,spike:t.spike??!1,source:"melee",move:i.id,ox:s.x,oz:s.z}),y=u.takeHit(g);this.onDealt(y,u,p,i.id,i.style,t)}}onDealt(t,e,i,n,s,r){const o=this.game,h=this.body;if(t==="hit"||t==="killed"){this.moveHits++;const l=(e.x+h.x)*.5,c=(e.z+h.z)*.5,u=Math.min(e.y+e.height*.6,h.y+1.2),d=(r?.heavy??!1)||n==="charge";o.fx.hit(l,u,c,d?16769184:16774880,d?1.4:1),o.sfx(d?"hitHeavy":"hit",l,u,c,.9+Math.random()*.2),o.shake(d?.22:.1,.12),e.isEnemy&&(this.gainFury(i*.14),o.style.hit(n,s),this.lastCombat=o.time)}else if(t==="blocked"){const l=h.x-e.x,c=h.z-e.z,u=Math.hypot(l,c)||1;h.vx=l/u*5,h.vz=c/u*5}}onBlocked(t){this.game.hud.flick("Blocked! Shields stop horns and breath from the front. Use your Tail (E), or get behind it.",5)}gainFury(t){if(this.state==="fury")return;const e=(this.hasUpgrade("furyHeart")?1.35:1)*this.game.style.reward,i=this.fury;this.fury=Math.min(100,this.fury+t*e),i<100&&this.fury>=100&&(this.game.toast("FURY READY - press X","good"),this.game.hud.furyReady())}reflectProjectiles(t){const e=this.body,i=t.hits[0];if(!(this.moveT<i.t0||this.moveT>i.t1))for(const n of this.game.projectiles){if(!n.alive||n.spec.fromPlayer||n.reflected)continue;const s=n.x-e.x,r=n.z-e.z;if(Math.hypot(s,r)>i.range+.4||Math.abs(n.y-(e.y+.8))>1.6||Math.abs(Vi(this.yaw,Ee(s,r)))>1.3)continue;const h=this.game.nearestEnemy(e.x,e.y,e.z,25);let l=Math.sin(this.yaw),c=Math.cos(this.yaw);if(h){const u=Math.hypot(h.x-n.x,h.z-n.z)||1;l=(h.x-n.x)/u,c=(h.z-n.z)/u}n.reflect(l,c),this.game.sfx("shieldBlock",n.x,n.y,n.z,1.4),this.game.fx.hit(n.x,n.y,n.z,16777215,1),this.game.style.bonus(40),this.game.toast("Reflected!","good")}}startSlam(){this.move=null,this.slamLanded=!1,this.gliding=!1,this.setState("slam"),this.body.vy=5,this.game.sfx("swingHeavy")}updateSlam(t){const e=this.game,i=this.body;if(this.slamLanded){if(this.friction(t,20),this.gravity(t,1),this.stateT>.32)this.setState("move");else if(this.stateT>.12){const n=e.input;n.buffered("jump",.15)&&(n.consume("jump"),i.vy=Ua*1.1,this.jumps=1,e.sfx("jump"),this.setState("move"))}}else if(this.friction(t,6),this.stateT<.14?this.gravity(t,.5):i.vy=-30,i.grounded&&this.stateT>.05){this.slamLanded=!0,this.stateT=0;const s=this.hasUpgrade("slamWave")?{...oc,range:6,launch:10,damage:26}:oc,r=new Set,o=Math.max(0,this.lastGroundedY-i.y),h=1+Math.min(1,o/12);for(const l of e.hittables()){if(!l.alive)continue;const c=l.x-i.x,u=l.z-i.z,d=Math.hypot(c,u);if(d-l.radius>s.range||Math.abs(l.y-i.y)>2.5)continue;r.add(l);const f=d||1,m=s.damage*this.meleeMult*h,v=l.takeHit(ze({damage:m,dirX:c/f,dirZ:u/f,knockback:s.knockback,launch:s.launch,stagger:s.stagger,hitstop:s.hitstop,heavy:!0,source:"melee",move:"slam",ox:i.x,oz:i.z,type:"physical"}));this.onDealt(v,l,m,"slam",20,s)}e.shake(.45,.3),e.sfx("pound",i.x,i.y,i.z),e.fx.ring(i.x,i.y,i.z,.4,s.range,16770736,.35),e.fx.dust(i.x,i.y,i.z,18),e.fx.rocks(i.x,i.y+.2,i.z,8),e.onSlam(i.x,i.y,i.z,s.range)}}updateBreath(t){const e=this.game,i=e.input,n=this.body,s=this.element,r=!n.grounded,o=this.lock??this.findTarget(10,!1);o?this.yaw=js(this.yaw,Ee(o.x-n.x,o.z-n.z),6,t):this.wish(this.w)>.1&&(this.yaw=Xi(this.yaw,Ee(this.w.x,this.w.z),3.2*t)),r?(this.friction(t,3),this.airBudget>0?(this.airBudget-=t*.6,n.vy=Math.max(n.vy-6*t,-1.2)):this.gravity(t,.6)):(this.steer(t,2.6,30,0),this.gravity(t,1));const h=Ux[s]*this.breath.costMul;if(this.mana-=h*t,this.breath.update(t),i.take("dodge",.12)){this.startDodge();return}i.take("jump",.12)&&!r&&(n.vy=Ua,this.jumps=1),(!i.down("breath")||this.mana<=0)&&(this.mana=Math.max(0,this.mana),this.mana<=0&&(e.toast("Out of mana","warn"),e.hud.flashMana()),this.setState("move"))}updateBurst(t){const e=this.body;this.friction(t,10),!e.grounded&&this.airBudget>0?e.vy=Math.max(e.vy-4*t,-.5):this.gravity(t,1);const i=this.lock??this.findTarget(16,!1);i&&this.stateT<.2&&(this.yaw=js(this.yaw,Ee(i.x-e.x,i.z-e.z),14,t)),this.stateT>=.22&&this.stateT-t<.22&&this.breath.burst(this.element,i),this.stateT>=.5&&this.setState("move")}startFury(){const t=this.game;this.fury=0,this.move=null,this.gliding=!1,this.breath.stop(),this.setState("fury"),t.sfx("fury"),t.hud.furyUsed(),this.breath.furyStart(this.element)}updateFury(t){const e=this.body,i=this.stateT;this.friction(t,6),i<.6?e.vy=5*(1-i/.6):i<2.4?e.vy=Math.sin(i*3)*.3:this.gravity(t,1),this.breath.furyUpdate(this.element,i,t),i>2.7&&this.setState("move")}findTarget(t,e){const i=this.game,n=this.body;if(this.lock&&this.lock.alive&&!e&&Math.hypot(this.lock.x-n.x,this.lock.z-n.z)<t+3)return this.lock;const s=this.wish(this.w),r=e?i.cam.yaw:s>.2?Ee(this.w.x,this.w.z):this.yaw;let o=null,h=1/0;for(const l of i.hittables()){if(!l.alive||!l.isEnemy)continue;const c=l.x-n.x,u=l.z-n.z,d=Math.hypot(c,u);if(d>t||Math.abs(l.y-n.y)>6)continue;const f=Math.abs(Vi(r,Ee(c,u)));if(!e&&f>1.9&&d>2.5)continue;const m=d+f*(e?8:2.5);m<h&&(h=m,o=l)}return o}takeHit(t,e){const i=this.game;if(!this.alive||this.invuln||this.state==="fury"||this.state==="fall"||this.state==="locked")return"none";if(this.iframes>0)return this.state==="dodge"&&this.onEvaded(),"dodged";const n=this.body;return this.hp-=t.damage,i.style.hurt(),i.sfx("hurt"),i.shake(.35,.25),i.hud.hurt(t.damage/this.maxHp),this.flashT=.25,this.breath.stop(),this.move=null,this.gliding=!1,this.dragonTimeActive=!1,i.stats.damageTaken+=t.damage,this.hp<=0?(this.hp=0,this.die(),"killed"):(n.vx=t.dirX*t.knockback,n.vz=t.dirZ*t.knockback,n.vy=Math.max(n.vy,t.launch>0?t.launch:2.5),n.grounded=!1,this.yaw=Ee(-t.dirX,-t.dirZ),this.hurtT=.4,this.iframes=.9,this.setState(t.knockback>=10?"down":"hurt"),"hit")}heal(t){this.hp=Math.min(this.maxHp,this.hp+t)}die(){const t=this.game;this.alive=!1,this.setState("dead"),t.sfx("death"),t.onPlayerDied()}pushOffEnemies(){const t=this.body;for(const e of this.game.enemies){if(!e.alive||e.def.flying)continue;const i=t.x-e.x,n=t.z-e.z,s=e.radius+t.radius*.9,r=Math.hypot(i,n);if(r<s&&r>1e-4&&Math.abs(t.y-e.y)<1.2){const o=(s-r)*(e.def.mass>.5?.3:.75);t.x+=i/r*o,t.z+=n/r*o}}}water(t){const e=this.game,i=this.body,n=e.waterLevel;if(this.inWater=!1,!(n<=-1e3))if(i.y<n+.05&&i.grounded){if(e.isDeepWater(i.x,i.z,i.y)){e.fx.splash(i.x,n,i.z),e.sfx("splash"),e.playerFell();return}this.inWater=!0,this.wadeFx-=t,this.wadeFx<=0&&Math.hypot(i.vx,i.vz)>1&&(this.wadeFx=.12,e.fx.emit(i.x,n+.05,i.z,{count:3,speed:2,dir:[0,1,0],spread:.8,life:[.3,.5],size:[.12,.2],color:13693183,gravity:12,additive:!1,alpha:.8}))}else!i.grounded&&i.y<n-.8&&(e.fx.splash(i.x,n,i.z),e.sfx("splash"),e.playerFell())}trackSafeGround(t){const e=this.body,i=this.game;if(this.safeT-=t,this.safeT>0||!e.grounded||this.inWater||e.ground&&e.ground.dynamic)return;this.safeT=.3;const n=.9;for(const[s,r]of[[n,0],[-n,0],[0,n],[0,-n]]){const o=i.col.groundAt(e.x+s,e.z+r,e.y+.5,.05).y;if(o<e.y-.6||i.isDeepWater(e.x+s,e.z+r,o))return}i.inHazard(e.x,e.y,e.z)||this.lastSafe.set(e.x,e.y,e.z)}respawnAtSafe(){const t=this.lastSafe;this.place(t.x,t.y+.1,t.z,this.yaw),this.setState("move"),this.iframes=1.2,this.body.grounded=!0}syncRig(t){const e=this.body,i=this.rig.root;i.position.set(e.x,e.y,e.z),i.rotation.y=this.yaw,i.visible=!this.hidden;const n=this.pose,s=Math.hypot(e.vx,e.vz);n.speed=this.state==="move"||this.state==="breath"||this.state==="charge"?Th(s/Na,0,1.3):0,n.grounded=e.grounded,n.vy=e.vy,n.glide=this.gliding,n.breath=this.state==="breath",n.aimPitch=this.breath.aimPitch,n.charge=this.state==="charge",n.dodge=this.state==="dodge"?this.stateT/jr:-1,n.hurt=this.hurtT/.4,n.dead=this.state==="dead",n.hover=this.state==="breath"&&!e.grounded,n.turn=0,n.talk=this.state==="locked"&&this.game.dialogueSpeaker==="aster",this.state==="attack"&&this.move?(n.attack=this.move.pose,n.attackT=this.move.id==="tailSpin"?this.moveT%.6/.6:this.moveT/this.move.duration):this.state==="slam"?(n.attack=this.slamLanded?"slamLand":"slamFall",n.attackT=this.slamLanded?this.stateT/.32:0):this.state==="burst"?(n.attack="burst",n.attackT=this.stateT/.5):this.state==="fury"?(n.attack="fury",n.attackT=this.stateT/2.7):n.attack=null,this.rig.update(t,n),n.flapT=1,this.flashT>0?this.rig.setFlash(this.flashT*4,16724016):this.counterWindow>0?this.rig.setFlash(.35+Math.sin(this.game.time*30)*.2,11567359):this.state==="fury"?this.rig.setFlash(.5,this.element==="fire"?16736288:this.element==="ice"?6344959:this.element==="earth"?8441936:10543359):this.rig.setFlash(0),this.rig.setOpacity(this.iframes>0&&this.state!=="dodge"&&Math.sin(this.game.time*40)>.3?.5:1);const r=this.game.col.groundAt(e.x,e.z,e.y+.1,.1).y;if(r>-1e3&&!this.hidden){const o=Math.max(0,e.y-r);this.blob.visible=!0,this.blob.position.set(e.x,r+.03,e.z);const h=Math.max(.35,1-o*.06);this.blob.scale.setScalar(h*1.2),this.blobMat.opacity=Math.max(.12,.4-o*.02)}else this.blob.visible=!1}dispose(){this.game.scene.remove(this.rig.root),this.game.scene.remove(this.blob)}}const to=100,Xa={burn:4,shock:1.6,freeze:3.2,steam:1.8},Zx=6;class Kx{heat=0;charge=0;chill=0;burn=0;shock=0;frozen=0;steam=0;resist;burnTick=0;constructor(t={}){this.resist={fire:1,lightning:1,ice:1,earth:1,...t}}get stunned(){return this.shock>0||this.frozen>0||this.steam>0}build(t,e){if(t==="physical"||t==="shadow"||t==="earth")return null;const i=this.resist[t];if(i<=0)return null;const n=e*i;if(t==="fire"){if(this.frozen>0)return this.frozen=Math.max(0,this.frozen-n*.05),null;if(this.heat+=n,this.heat>=to)return this.heat=0,this.burn=Xa.burn,"burn"}else if(t==="lightning"){if(this.charge+=n,this.charge>=to)return this.charge=0,this.shock=Xa.shock,"shock"}else if(t==="ice"&&(this.chill+=n,this.chill>=to))return this.chill=0,this.frozen=Xa.freeze,this.burn=0,"freeze";return null}update(t){const e=18*t;this.heat=Math.max(0,this.heat-e),this.charge=Math.max(0,this.charge-e),this.chill=Math.max(0,this.chill-e*(this.frozen>0?0:1)),this.shock=Math.max(0,this.shock-t),this.frozen=Math.max(0,this.frozen-t),this.steam=Math.max(0,this.steam-t);let i=0;if(this.burn>0)for(this.burn=Math.max(0,this.burn-t),this.burnTick+=t;this.burnTick>=.5;)this.burnTick-=.5,i+=Zx*.5;else this.burnTick=0;return i}clear(){this.heat=this.charge=this.chill=0,this.burn=this.shock=this.frozen=this.steam=0}}function Jx(a,t){return a.frozen>0&&(t.heavy||t.type==="earth")?"shatter":a.shock>0&&t.type==="fire"||a.burn>0&&t.type==="lightning"?"overload":a.burn>0&&t.type==="ice"?"steam":null}function Qx(a,t){t==="shatter"?(a.frozen=0,a.chill=0):t==="overload"?(a.shock=0,a.burn=0,a.charge=0):(a.burn=0,a.heat=0,a.steam=Xa.steam)}const kd={shatter:{name:"SHATTER",color:12580095,radius:0,damage:30},overload:{name:"OVERLOAD",color:16765802,radius:3.5,damage:28},steam:{name:"STEAM BURST",color:15267071,radius:4,damage:12}};function jx(a,t,e,i,n){let s=a*(e[t]??1);return i&&i.shock>0&&(s*=1.25),n==="shatter"&&(s=s*2+kd.shatter.damage),Math.max(0,s)}const t1=new C;class Ld{def;body;model;status;isEnemy=!0;game;hp;maxHp;alive=!0;state="spawn";stateT=0;yaw=0;homeX;homeZ;aggro=!1;attack=null;attackHit=!1;cooldowns=new Map;globalCd=.8;hasToken=!1;tokenT=0;poiseDmg=0;poiseRegen=0;guardBroken=0;flipped=0;flash=0;hurtT=0;deadT=0;strafeDir=nt.chance(.5)?1:-1;strafeSwap=2;wander=0;wanderX=0;wanderZ=0;lastHitBy="";onDeath=null;scripted=!1;isBoss=!1;burnFx=0;statusFx=0;iceBlock=null;airTime=0;hitstunMax=0;lastDamage=0;spawnDelay=0;constructor(t,e,i,n,s,r=0){this.game=t,this.def=e,this.body=new wd(e.radius,e.height),this.body.setPos(i,n,s),this.body.stepUp=.5,this.homeX=i,this.homeZ=s,this.yaw=r;const o=t.difficultyInfo.enemyHp;this.maxHp=this.hp=e.hp*o,this.model=e.build(),this.model.root.position.set(i,n,s),this.status=new Kx(e.statusResist),t.scene.add(this.model.root),this.wanderX=i,this.wanderZ=s}get x(){return this.body.x}get y(){return this.body.y}get z(){return this.body.z}get radius(){return this.def.radius}get height(){return this.def.height}get airborne(){return this.state==="air"}get stunned(){return this.status.stunned}get center(){return t1.set(this.body.x,this.body.y+this.def.height*.55,this.body.z)}distToPlayer(){const t=this.game.player.body;return Math.hypot(t.x-this.body.x,t.z-this.body.z)}yawToPlayer(){const t=this.game.player.body;return Ee(t.x-this.body.x,t.z-this.body.z)}setState(t){this.state!==t&&((this.state==="windup"||this.state==="active"||this.state==="recover")&&t!=="active"&&t!=="recover"&&this.releaseToken(),this.state=t,this.stateT=0)}releaseToken(){this.hasToken&&(this.game.director.release(this),this.hasToken=!1)}takeHit(t){if(!this.alive||this.state==="spawn")return"none";const e=this.game;if(this.aggro=!0,this.def.shield&&this.guardBroken<=0&&!this.status.stunned&&this.state!=="hitstun"&&this.state!=="air"&&this.state!=="down"){const h=Ee(t.ox-this.body.x,t.oz-this.body.z);if(Math.abs(Vi(this.yaw,h))<1.2){if(!(t.heavy||t.type==="earth"||t.source==="charge"&&e.player.hasUpgrade("ramBreaker")))return e.fx.hit(this.body.x+Math.sin(this.yaw)*this.def.radius,this.body.y+.9,this.body.z+Math.cos(this.yaw)*this.def.radius,12574975,.8),e.sfx("shieldBlock",this.body.x,this.body.y,this.body.z),t.source==="melee"&&e.hitstop(.04),this.game.player.onBlocked(this),"blocked";this.guardBroken=4,e.toast("Guard broken!","good"),e.sfx("shieldBlock",this.body.x,this.body.y,this.body.z,.6),e.fx.hit(this.body.x,this.body.y+1,this.body.z,16777215,1.5)}}if(this.def.armored&&this.flipped<=0)if(t.heavy||t.type==="earth")this.flipped=5,e.sfx("hitHeavy",this.body.x,this.body.y,this.body.z,.8),e.toast("Flipped!","good"),this.state="down",this.stateT=0,this.body.vy=6;else return e.fx.hit(this.body.x,this.body.y+.6,this.body.z,13682864,.6),e.sfx("shieldBlock",this.body.x,this.body.y,this.body.z,.8),t.source==="melee"&&e.hitstop(.03),"immune";const i=Jx(this.status,t),n=this.def.resist;if((n[t.type]??1)<=0&&!i)return e.fx.sparkle(this.body.x,this.body.y+this.def.height*.6,this.body.z,16777215,4),"immune";let s=jx(t.damage,t.type,n,this.status,i);this.flipped>0&&(s*=1.5),e.isWarded(this)&&(s*=.35,e.fx.emit(this.body.x,this.body.y+this.def.height*.5,this.body.z,{count:6,speed:2,life:[.2,.4],size:[.3,.5],color:11554047,bright:1.5,jitter:this.def.radius}),e.hud.wardHint()),this.hp-=s,this.lastDamage=s,this.lastHitBy=t.move,this.flash=.12,e.onEnemyDamaged(this,s,t,i),i&&(Qx(this.status,i),e.triggerReaction(this,i));const r=this.status.build(t.type,t.buildup);return r&&this.onStatus(r),this.hp<=0?(this.die(t,i),"killed"):(this.poiseDmg+=t.stagger,this.poiseRegen=1.5,(this.def.poise<=0||this.poiseDmg>=this.def.poise||this.status.frozen>0||this.state==="air")&&!this.isBoss?(this.def.poise>0&&this.poiseDmg>=this.def.poise&&(this.poiseDmg=0),this.flinch(t)):this.isBoss&&this.poiseDmg>=this.def.poise&&this.def.poise>0&&(this.poiseDmg=0,this.onBossStagger(t)),t.hitstop>0&&e.hitstop(t.hitstop),"hit")}flinch(t){const e=this.def.mass,i=this.body;if(this.releaseToken(),this.attack=null,this.status.frozen>0){i.vx=t.dirX*t.knockback*e*.3,i.vz=t.dirZ*t.knockback*e*.3;return}if(t.spike&&this.state==="air"){i.vy=-22,i.vx=t.dirX*2,i.vz=t.dirZ*2;return}if(t.launch>0&&e>.15){i.vy=t.launch*Math.min(1,.4+e*.6),i.vx=t.dirX*t.knockback*e,i.vz=t.dirZ*t.knockback*e,this.setState("air"),this.airTime=0;return}if(this.state==="air"){i.vy=Math.max(i.vy,3.5),i.vx=t.dirX*t.knockback*e*.6,i.vz=t.dirZ*t.knockback*e*.6;return}i.vx=t.dirX*t.knockback*e,i.vz=t.dirZ*t.knockback*e,this.def.flying&&(i.vy=Math.max(i.vy,1)),this.hitstunMax=.28+Math.min(.5,t.stagger*.008),t.knockback*e>9&&!this.def.flying?(this.setState("down"),this.body.vy=4):this.setState("hitstun")}onBossStagger(t){}onStatus(t){const e=this.game;this.releaseToken(),t==="freeze"?(this.attack=null,this.state!=="air"&&this.setState("hitstun"),e.sfx("iceCrack",this.body.x,this.body.y,this.body.z),e.toast("Frozen","info"),this.ensureIceBlock()):t==="shock"?(this.attack=null,this.state!=="air"&&this.setState("hitstun"),e.sfx("zap",this.body.x,this.body.y,this.body.z,.7)):e.sfx("fireBurst",this.body.x,this.body.y,this.body.z,1.2,.5)}ensureIceBlock(){if(this.iceBlock)return;const t=this.def.radius*1.35,e=new Qs(1,0),i=new Ki({color:12578815,transparent:!0,opacity:.55,roughness:.1,metalness:.1,emissive:3842256,emissiveIntensity:.25,flatShading:!0,depthWrite:!1});this.iceBlock=new J(e,i),this.iceBlock.scale.set(t,this.def.height*.65,t),this.iceBlock.position.y=this.def.height*.5,this.model.root.add(this.iceBlock)}die(t,e=null){if(!this.alive)return;this.alive=!1,this.releaseToken(),this.setState("dead"),this.deadT=0;const i=this.game;t&&(this.body.vx=t.dirX*Math.max(4,t.knockback)*this.def.mass,this.body.vz=t.dirZ*Math.max(4,t.knockback)*this.def.mass,this.body.vy=this.def.flying?2:5),i.sfx("enemyDie",this.body.x,this.body.y,this.body.z,.9+nt.next()*.2),i.onEnemyKilled(this,e),this.onDeath?.(this),this.iceBlock&&(i.fx.shatter(this.body.x,this.body.y+.8,this.body.z),this.model.root.remove(this.iceBlock),this.iceBlock=null)}dispose(){this.releaseToken(),this.game.scene.remove(this.model.root),this.model.dispose?.()}update(t){const e=this.game,i=this.body;this.stateT+=t,this.flash=Math.max(0,this.flash-t),this.guardBroken=Math.max(0,this.guardBroken-t),this.flipped=Math.max(0,this.flipped-t),this.globalCd=Math.max(0,this.globalCd-t);for(const[h,l]of this.cooldowns)this.cooldowns.set(h,l-t);if(this.poiseRegen-=t,this.poiseRegen<=0&&(this.poiseDmg=Math.max(0,this.poiseDmg-this.def.poise*t)),this.state==="dead"){this.deadT+=t,this.integrate(t,1),this.deadT>.35&&this.deadT-t<=.35&&e.fx.shadowPoof(i.x,i.y+this.def.height*.5,i.z,this.def.radius*1.4),this.syncModel(t);return}const n=this.status.update(t);if(n>0&&(this.hp-=n,e.onEnemyDamaged(this,n,null,null),this.hp<=0)){this.die(null);return}if(this.statusVisuals(t),this.state==="spawn"){if(this.spawnDelay>0){this.spawnDelay-=t,this.stateT=0,this.model.root.visible=!1;return}this.model.root.visible=!0,this.stateT<t*1.5&&(e.fx.shadowPoof(i.x,i.y+.2,i.z,this.def.radius*1.2),e.sfx("enemyAlert",i.x,i.y,i.z,.7)),this.stateT>.7&&(this.setState("chase"),this.aggro=!0),this.integrate(t,1),this.syncModel(t);return}const s=this.status.frozen>0,r=this.status.stunned;!s&&this.iceBlock&&(e.fx.shatter(i.x,i.y+.8,i.z,14678271),e.sfx("iceCrack",i.x,i.y,i.z),this.model.root.remove(this.iceBlock),this.iceBlock=null),this.state==="air"?(this.airTime+=t,i.grounded&&i.vy<=0&&this.airTime>.1&&(this.airTime>.5?(e.fx.dust(i.x,i.y,i.z,6),this.setState("down")):this.setState("hitstun"),this.hitstunMax=.3)):this.state==="hitstun"?this.stateT>this.hitstunMax&&!r&&this.setState("chase"):this.state==="down"?this.stateT>(this.flipped>0?4.5:1)&&!r&&(this.setState("chase"),this.flipped=0):r||(this.scripted?this.think(t):this.ai(t));const o=this.state==="air"?.5:this.state==="hitstun"||this.state==="down"?7:12;this.integrate(t,o),this.separate(),this.syncModel(t)}think(t){}ai(t){const e=this.game,i=e.player,n=this.distToPlayer(),s=this.def,r=this.yawToPlayer(),o=this.body;if(!this.aggro)if(n<s.aggroRange&&i.alive&&Math.abs(i.body.y-o.y)<8)this.aggro=!0,e.sfx("enemyAlert",o.x,o.y,o.z),e.fx.emit(o.x,o.y+s.height+.5,o.z,{count:6,speed:2,life:[.3,.5],size:[.2,.3],color:16732240,bright:2}),this.setState("chase");else{this.idleWander(t);return}if(!i.alive||i.hidden){this.idleWander(t);return}if(Math.hypot(o.x-this.homeX,o.z-this.homeZ)>45&&n>20){this.aggro=!1,this.setState("idle");return}if(this.state==="windup"||this.state==="active"||this.state==="recover"){this.runAttack(t,n,r);return}if(s.panics&&this.status.burn>0){this.yaw=Xi(this.yaw,r+Math.PI+Math.sin(e.time*3)*.8,s.turnRate*t),this.moveForward(s.speed*1.2,t);return}const h=s.keepAway??0,l=h>0;if(!this.hasToken&&this.globalCd<=0&&(this.hasToken=e.director.request(this,l),this.tokenT=0),this.hasToken){this.tokenT+=t;const c=this.pickAttack(n);if(c){this.startAttack(c);return}this.tokenT>4&&(this.releaseToken(),this.globalCd=1)}if(this.yaw=Xi(this.yaw,r,s.turnRate*t),l)n<h*.7?this.moveDir(r+Math.PI,s.speed,t):n>h*1.3?this.moveDir(r,s.speed,t):this.strafe(t,r,s.speed*.5),this.setState(n>h*1.3?"chase":"strafe");else if(this.hasToken)this.moveDir(r,s.speed*1.1,t),this.setState("chase");else{const c=3.4+(this.def.radius>1?1.5:0);n>c+.6?(this.moveDir(r+this.strafeDir*(n<6?.5:.1),s.speed,t),this.setState("chase")):n<c-.8?(this.moveDir(r+Math.PI,s.speed*.6,t),this.setState("strafe")):(this.strafe(t,r,s.speed*.45),this.setState("strafe"))}}strafe(t,e,i){this.strafeSwap-=t,this.strafeSwap<=0&&(this.strafeSwap=1.5+nt.next()*2,this.strafeDir=-this.strafeDir),this.moveDir(e+this.strafeDir*Math.PI*.5,i,t,!1)}idleWander(t){this.wander-=t;const e=this.body;this.wander<=0&&(this.wander=2+nt.next()*3,this.wanderX=this.homeX+nt.signed()*4,this.wanderZ=this.homeZ+nt.signed()*4);const i=this.wanderX-e.x,n=this.wanderZ-e.z;Math.hypot(i,n)>.6&&(this.moveDir(Ee(i,n),this.def.speed*.3,t),this.setState("idle"))}moveDir(t,e,i,n=!0){const s=this.body,r=Math.sin(t)*e,o=Math.cos(t)*e,h=1-Math.exp(-10*i);if(s.vx+=(r-s.vx)*h,s.vz+=(o-s.vz)*h,n&&(this.yaw=Xi(this.yaw,t,this.def.turnRate*i)),!this.def.flying&&s.grounded){const l=s.x+Math.sin(t)*(this.def.radius+.6),c=s.z+Math.cos(t)*(this.def.radius+.6),u=this.game.col.groundAt(l,c,s.y+.6,.1).y;(u<s.y-1.6||this.game.isDeepWater(l,c,u))&&(s.vx*=.1,s.vz*=.1)}}moveForward(t,e){this.moveDir(this.yaw,t,e,!1)}pickAttack(t){let e=0;const i=[];for(const s of this.def.attacks)(this.cooldowns.get(s.id)??0)>0||t>s.range||t<(s.minRange??0)||(i.push(s),e+=s.weight);if(i.length===0)return null;let n=nt.next()*e;for(const s of i)if(n-=s.weight,n<=0)return s;return i[i.length-1]}startAttack(t){this.attack=t,this.attackHit=!1,this.setState("windup");const e=this.game;e.sfx("enemyAttack",this.body.x,this.body.y,this.body.z,1+nt.signed()*.1,.8),t.telegraph&&e.fx.ring(this.body.x,this.body.y,this.body.z,.2,t.shockwave?.radius??t.hitRange??3,16724016,t.windup)}runAttack(t,e,i){const n=this.attack,s=this.game,r=this.body,o=s.difficultyInfo.aggression;if(this.state==="windup"){this.yaw=Xi(this.yaw,i,this.def.turnRate*1.5*t),r.vx*=.8,r.vz*=.8,this.stateT>=n.windup/o&&(this.state="active",this.stateT=0,this.onActiveStart(n));return}if(this.state==="active"){n.lunge&&this.moveForward(n.lunge,t),(n.kind==="melee"||n.kind==="dive")&&this.meleeCheck(n),this.stateT>=n.active&&(this.state="recover",this.stateT=0);return}r.vx*=.85,r.vz*=.85,this.stateT>=n.recover/o&&(this.cooldowns.set(n.id,n.cooldown),this.globalCd=(.5+nt.next()*.8)/o,this.attack=null,this.releaseToken(),this.setState("chase"))}onActiveStart(t){const e=this.game,i=this.body;if(t.kind==="projectile"&&t.projectile){const n=e.player.body,s=t.projectile.count??1,r=t.projectile.spread??.2,o=i.x+Math.sin(this.yaw)*this.def.radius,h=i.y+this.def.height*.7,l=i.z+Math.cos(this.yaw)*this.def.radius,c=t.projectile.aimLead??.3,u=n.x+n.vx*c,d=n.z+n.vz*c,f=n.y+.8;for(let m=0;m<s;m++){const v=s===1?0:(m/(s-1)-.5)*r*2,p=Ee(u-o,d-l)+v,g=Math.hypot(u-o,d-l),y=Math.atan2(f-h,g);e.spawnProjectile({...t.projectile,x:o,y:h,z:l,dx:Math.sin(p)*Math.cos(y),dy:Math.sin(y),dz:Math.cos(p)*Math.cos(y),fromPlayer:!1})}}else t.kind==="slam"&&t.shockwave&&(e.spawnShockwave(i.x,i.y,i.z,t.shockwave.radius,t.shockwave.speed,t.damage*e.difficultyInfo.enemyDamage,t.knockback,this),e.shake(.35,.3),e.fx.dust(i.x,i.y,i.z,14),e.sfx("pound",i.x,i.y,i.z),this.meleeCheck(t))}meleeCheck(t){if(this.attackHit)return;const e=this.game,i=e.player;if(!i.alive)return;const n=this.body,s=i.body,r=s.x-n.x,o=s.z-n.z,h=Math.hypot(r,o)-s.radius,l=(t.hitRange??1.6)+this.def.radius;if(h>l||s.y>n.y+this.def.height+.5||s.y+s.height<n.y-.3||Math.abs(Vi(this.yaw,Ee(r,o)))>(t.hitArc??1))return;this.attackHit=!0;const u=Math.hypot(r,o)||1;i.takeHit(ze({damage:t.damage*e.difficultyInfo.enemyDamage,type:t.type??"physical",dirX:r/u,dirZ:o/u,knockback:t.knockback,launch:t.launch??0,source:"enemy",move:t.id,fromPlayer:!1,ox:n.x,oz:n.z}),this)}integrate(t,e){const i=this.body,n=this.def,s=this.status.frozen>0;if(n.flying&&this.alive&&this.state!=="air"&&!s){const r=this.game.col.groundAt(i.x,i.z,i.y+2,.2).y,o=Math.max(r,this.game.waterLevel)+(n.hover??2.5)+Math.sin(this.game.time*2+this.homeX)*.3;i.vy+=(o-i.y)*6*t-i.vy*3*t}else{const r=this.state==="air"?22:30;i.vy=Math.max(-30,i.vy-r*t)}if(e>0&&(i.grounded||n.flying)){const r=Math.exp(-e*t);this.state!=="chase"&&this.state!=="strafe"&&this.state!=="idle"&&this.state!=="active"&&(i.vx*=r,i.vz*=r)}s&&(i.vx*=Math.exp(-6*t),i.vz*=Math.exp(-6*t)),this.game.col.move(i,t),i.y<this.game.killY?this.die(null):!n.flying&&i.grounded&&this.game.isDeepWater(i.x,i.z,i.y)&&(this.game.fx.splash(i.x,this.game.waterLevel,i.z),this.game.sfx("splash",i.x,i.y,i.z),this.die(null))}separate(){const t=this.body;for(const o of this.game.enemies){if(o===this||!o.alive)continue;const h=t.x-o.body.x,l=t.z-o.body.z,c=this.def.radius+o.def.radius,u=h*h+l*l;if(u<c*c&&u>1e-6&&Math.abs(t.y-o.body.y)<1.5){const d=Math.sqrt(u),f=(c-d)*.5;t.x+=h/d*f,t.z+=l/d*f}}const e=this.game.player.body,i=t.x-e.x,n=t.z-e.z,s=this.def.radius+e.radius*.9,r=Math.hypot(i,n);if(r<s&&r>1e-4&&Math.abs(t.y-e.y)<1.2&&this.state!=="dead"){const o=(s-r)*(this.def.mass>.5?.7:.25);t.x+=i/r*o,t.z+=n/r*o}}statusVisuals(t){const e=this.game,i=this.body,n=this.def.height;if(this.status.burn>0&&(this.burnFx-=t,this.burnFx<=0&&(this.burnFx=.05,e.fx.emit(i.x,i.y+n*.5,i.z,{count:2,speed:1.5,dir:[0,1.5,0],spread:.5,life:[.3,.6],size:[.35,.6],sizeEnd:.1,color:16752704,colorEnd:16723984,bright:1.8,jitter:this.def.radius*.6,gravity:-3}))),(this.status.shock>0||this.status.steam>0)&&(this.statusFx-=t,this.statusFx<=0))if(this.statusFx=.08,this.status.shock>0){const s=new C(i.x+nt.signed()*this.def.radius,i.y+nt.next()*n,i.z+nt.signed()*this.def.radius),r=new C(i.x+nt.signed()*this.def.radius,i.y+nt.next()*n,i.z+nt.signed()*this.def.radius);e.fx.arc(s,r,12577023,.05,.08,.5)}else e.fx.emit(i.x,i.y+n,i.z,{count:2,speed:.8,dir:[0,1,0],life:[.6,1],size:[.4,.7],sizeEnd:2,color:15791359,alpha:.5,additive:!1})}syncModel(t){const e=this.body,i=this.model.root;i.position.set(e.x,e.y,e.z),i.rotation.y=this.yaw;const n=this.status.frozen>0,s=this.status.shock>0,r={state:this.state,t:this.stateT,speed:Th(Math.hypot(e.vx,e.vz)/Math.max(1,this.def.speed),0,1.5),attack:this.attack?.pose??null,windup:this.state==="windup"&&this.attack?this.stateT/this.attack.windup:0,frozen:n,shocked:s,dead:this.state==="dead",deadT:this.deadT,airborne:this.state==="air"||!e.grounded,guard:!!this.def.shield&&this.guardBroken<=0,flipped:this.flipped>0};n||this.model.update(s?t*.2:t,r),s&&(i.position.x+=Math.sin(this.game.time*90)*.04);const o=this.flash>0?16777215:this.state==="windup"?16719904:0,h=this.flash>0?this.flash*8:this.state==="windup"?.35+.35*Math.sin(this.stateT*30):0;if(this.model.setFlash(h,o),this.state==="dead"){const l=Math.max(0,1-Math.max(0,this.deadT-.25)*2.5);i.scale.setScalar(Math.max(.001,l))}}get removable(){return this.state==="dead"&&this.deadT>.8}}const ae=(a,t,e)=>new C(a,t,e);class ws{root=new kt;flashMats=[];time=Math.random()*10;skin(t,e=.7){const i=yi(t,{rough:e});return this.flashMats.push(i),i}setFlash(t,e){for(const i of this.flashMats)i.emissive.setHex(e),i.emissiveIntensity=t}dispose(){for(const t of this.flashMats)t.dispose()}}class Ds extends ws{body=new kt;torso=new kt;head=new kt;arms=[];legs=[];p={lean:.25,armR:0,elbowR:0,armL:0,elbowL:0,twist:0,bodyY:0,headPitch:0,back:0,sideRoll:0};phase=0;o;constructor(t){super(),this.o=t;const e=t.scale,i=t.bulk,n=this.skin(t.skin,.65),s=this.skin(t.belly,.75),r=te(t.eye),o=at(15788248,{rough:.4});this.root.add(this.body),this.body.scale.setScalar(e);const h=.5+i*.15;this.body.position.y=h,this.body.add(this.torso);const l=.34+i*.2,c=Dt(l,.38+i*.12,.3+i*.12,n,14);c.position.set(0,.35,0),this.torso.add(c);const u=Dt(l*.8,.28,.27+i*.08,s,12);if(u.position.set(0,.2,.08),this.torso.add(u),t.armor!==void 0){const v=at(t.armor,{rough:.35,metal:.6}),p=Dt(l*1.05,.3,.33+i*.1,v,12);p.position.set(0,.45,.02),this.torso.add(p);for(const g of[-1,1]){const y=Dt(.16+i*.05,.1,.16,v,10);y.position.set(g*(l+.02),.6,0),this.torso.add(y);const b=Ae(.05,.18,v,5);b.position.set(g*(l+.05),.66,0),b.rotation.z=-g*.6,this.torso.add(b)}}if(t.cracks!==void 0){const v=te(t.cracks);for(let p=0;p<5;p++){const g=Dt(.03,.14,.02,v,6);g.position.set(Math.sin(p*1.7)*l*.7,.3+p%3*.1,.25+i*.12),g.rotation.z=p*.8,this.torso.add(g)}for(let p=0;p<4;p++){const g=Ae(.07+i*.04,.22+i*.1,at(2759222,{rough:.6}),5);g.position.set((p-1.5)*.12,.62+i*.1,-.2-Math.abs(p-1.5)*.04),g.rotation.x=-.6,this.torso.add(g)}}this.head.position.set(0,.72+i*.1,.06),this.torso.add(this.head);const d=1-i*.35,f=Dt(.3*d,.27*d,.28*d,n,14);this.head.add(f);const m=Dt(.18*d,.12*d,.12*d,n,10);m.position.set(0,-.06*d,.22*d),this.head.add(m);for(const v of[-1,1]){const p=Dt(.07*d,.05*d,.04*d,r,8);if(p.position.set(v*.12*d,.06*d,.24*d),p.rotation.z=v*-.35,this.head.add(p),t.ears==="long"){const g=new J($i([ae(0,0,0),ae(v*.2,.08,-.04),ae(v*.42,.2,-.12)],.08,.005,8,6),n);g.position.set(v*.2*d,.08*d,-.02),this.head.add(g)}else if(t.ears==="short"){const g=Ae(.07,.2,n,5);g.position.set(v*.2*d,.15*d,-.05),g.rotation.z=-v*.9,this.head.add(g)}else{const g=new J($i([ae(0,0,0),ae(v*.12,.12,.02),ae(v*.2,.3,.12)],.07,.005,8,6),at(14208952,{rough:.5}));g.position.set(v*.18*d,.14*d,0),this.head.add(g)}}for(let v=-2;v<=2;v++){const p=Ae(.02,.06,o,4);p.position.set(v*.045*d,-.12*d,.28*d),p.rotation.x=Math.PI,this.head.add(p)}if(t.hood!==void 0){const v=at(t.hood,{rough:.9,side:we}),p=new J(new cn(.38*d,.62,10,1,!0),v);p.position.set(0,.16,-.05),p.rotation.x=-.25,this.head.add(p);const g=new J(new cn(.5,1,10,1,!0,Math.PI*.2,Math.PI*1.6),v);g.position.set(0,.2,-.05),g.rotation.y=Math.PI,this.torso.add(g)}for(const v of[1,-1]){const p=new kt;p.position.set(v*(l+.05),.55,0),this.torso.add(p);const g=.3+i*.2;p.add(We(ae(0,0,0),ae(0,-g,0),.09+i*.1,.07+i*.08,n,8));const y=new kt;y.position.set(0,-g,0),p.add(y);const b=.28+i*.2;y.add(We(ae(0,0,0),ae(0,-b,.02),.07+i*.08,.06+i*.1,n,8));const x=Dt(.08+i*.12,.08+i*.1,.08+i*.1,n,8);x.position.set(0,-b-.04,.02),y.add(x);for(let T=-1;T<=1;T++){const R=Ae(.018+i*.02,.08+i*.05,o,4);R.position.set(T*.04,-b-.1-i*.08,.06),R.rotation.x=Math.PI*.8,y.add(R)}const S=new kt;S.position.set(0,-b-.05,.03),y.add(S),v===-1?this.buildWeapon(S,t):this.buildOffhand(S,t),this.arms.push({sh:p,el:y,side:v})}for(const v of[1,-1]){const p=new kt;p.position.set(v*.18,.02,0),this.body.add(p);const g=.26+i*.08;p.add(We(ae(0,0,0),ae(0,-g,.04),.1+i*.08,.08+i*.06,n,8));const y=new kt;y.position.set(0,-g,.04),p.add(y);const b=h-g-.04;y.add(We(ae(0,0,0),ae(0,-b,-.03),.08+i*.06,.06+i*.05,n,8));const x=Dt(.1+i*.05,.05,.16+i*.05,n,8);x.position.set(0,-b+.02,.06),y.add(x),this.legs.push({hip:p,knee:y,side:v})}this.root.traverse(v=>{v.isMesh&&(v.castShadow=!0)})}buildWeapon(t,e){const i=at(5913122,{rough:.9}),n=at(14471868,{rough:.6}),s=at(9080736,{rough:.3,metal:.7}),r=e.weaponGlow!==void 0?te(e.weaponGlow):null;switch(e.weapon){case"club":{const o=We(ae(0,0,0),ae(0,.1,.6),.04,.06,i,6);t.add(o);const h=Dt(.1,.1,.16,n,8);h.position.set(0,.1,.62),t.add(h);for(let l=0;l<3;l++){const c=Ae(.03,.1,n,4);c.position.set(Math.sin(l*2.1)*.08,.1+Math.cos(l*2.1)*.08,.66),c.lookAt(new C(Math.sin(l*2.1),.1+Math.cos(l*2.1),.66).multiplyScalar(3)),t.add(c)}break}case"spear":{t.add(We(ae(0,0,-.6),ae(0,0,.9),.03,.03,i,6));const o=Ae(.06,.28,r??s,4);o.position.set(0,0,.9),o.rotation.x=Math.PI/2,t.add(o);break}case"staff":{t.add(We(ae(0,-.5,0),ae(0,.9,.05),.03,.035,i,6));const o=Dt(.12,.12,.12,r??te(12611839),10);o.position.set(0,.98,.05),t.add(o);const h=new J(new bi(.15,.02,6,16),n);h.position.set(0,.98,.05),t.add(h);break}case"sword":{t.add(We(ae(0,0,-.1),ae(0,0,.12),.035,.035,at(2760752),6));const o=ac(.3,.05,.06,s);o.position.set(0,0,.12),t.add(o);const h=ac(.08,.025,1,r??s);h.position.set(0,0,.64),t.add(h);break}}}buildOffhand(t,e){if(e.offhand==="shield"){const i=at(4861984,{rough:.9}),n=at(10132136,{rough:.3,metal:.8}),s=new kt,r=new J(new ne(.5,.5,.08,16),i);r.rotation.x=Math.PI/2,s.add(r);const o=new J(new bi(.5,.04,6,24),n);s.add(o);const h=Dt(.12,.12,.08,n,8);h.position.z=.05,s.add(h);const l=Dt(.2,.2,.02,te(e.weaponGlow??11554047),8);l.position.z=.05,l.scale.set(.2,.05,.02),s.add(l),s.position.set(-.1,.25,.28),s.rotation.y=-.2,t.add(s)}else if(e.offhand==="orb"){const i=Dt(.13,.13,.13,te(e.weaponGlow??12611839),10);i.position.set(0,-.05,.1),t.add(i)}}update(t,e){this.time+=t;const i=this.p,n=this.time,s=e.speed;this.phase+=t*(4+s*8)*(s>.05?1:0);let r=.2+s*.15,o=Math.sin(this.phase)*.6*s,h=-Math.sin(this.phase)*.6*s,l=-.4,c=-.4,u=0,d=Math.abs(Math.sin(this.phase))*.06*s+Math.sin(n*3)*.015,f=Math.sin(n*1.7)*.05,m=0,v=0,p=14;const g=e.attack;if(e.guard&&this.o.offhand==="shield"&&(o=-1.2,l=-.9),e.state==="windup"||e.state==="active"||e.state==="recover"){p=22;const b=le(0,1,e.windup),x=e.state==="windup"?0:e.state==="active"?le(0,.12,e.t):1,S=e.state==="recover"?1-le(0,.5,e.t):1;switch(g){case"swing":h=Pt(Pt(0,-2.6,b),.7,x)*S,c=Pt(-1.2*b,-.1,x),r=Pt(.2-b*.3,.6,x),u=Pt(.3*b,-.3,x)*S;break;case"thrust":h=Pt(-.3*b,-1.5,x)*S-.2,c=Pt(-1.6*b,0,x),r=Pt(.1,.5,x),u=Pt(.4*b,-.2,x)*S;break;case"throw":h=Pt(-2.4*b,-1.2,x)*S,c=Pt(-1*b,0,x),u=Pt(.6*b,-.4,x)*S;break;case"cast":h=-2.4*Math.max(b,1-x*.5)*S,o=-1.8*b*S,c=-.2,f=-.3*b,r=.05;break;case"slam":h=Pt(-2.8*b,.2,x)*S,o=Pt(-2.8*b,.2,x)*S,c=l=Pt(-.3,0,x),r=Pt(-.25*b,.8,x),d-=x*.1;break;case"charge":r=.7*Math.max(b,x),h=o=.8*Math.max(b,x);break;default:h=Pt(-1.5*b,.4,x)*S,r=Pt(.2,.5,x)}}e.state==="hitstun"&&(m=.5*(1-le(0,.3,e.t)),h=o=-.6,p=30),e.state==="air"&&(m=.6,h=-2+Math.sin(n*20)*.5,o=-2+Math.cos(n*20)*.5,p=20),(e.state==="down"||e.flipped)&&(m=1.45,d=-.35,h=o=-1.5+Math.sin(n*12)*(e.flipped?.4:.1),p=12),e.dead&&(m=1.4,d=-.3,p=10),e.state==="spawn"&&(d=-1.2*(1-le(0,.7,e.t))),e.shocked&&(v=Math.sin(n*60)*.1),i.lean=Ft(i.lean,r,p,t),i.armR=Ft(i.armR,o,p,t),i.armL=Ft(i.armL,h,p,t),i.elbowR=Ft(i.elbowR,l,p,t),i.elbowL=Ft(i.elbowL,c,p,t),i.twist=Ft(i.twist,u,p,t),i.bodyY=Ft(i.bodyY,d,16,t),i.headPitch=Ft(i.headPitch,f,p,t),i.back=Ft(i.back,m,p,t),i.sideRoll=Ft(i.sideRoll,v,30,t);const y=(.5+this.o.bulk*.15)*this.o.scale;this.body.position.y=y+i.bodyY*this.o.scale,this.body.rotation.set(-i.back,0,i.sideRoll),this.torso.rotation.set(i.lean,i.twist,0),this.head.rotation.set(i.headPitch-i.lean*.6,0,0);for(const b of this.arms){const x=b.side===-1;b.sh.rotation.set(x?i.armL:i.armR,0,b.side*.15),b.el.rotation.set(x?i.elbowL:i.elbowR,0,0)}for(const b of this.legs){const x=Math.sin(this.phase+(b.side>0?0:Math.PI)),S=e.state==="air"?1:0;b.hip.rotation.set(-x*.7*s-i.lean*.3-S*.8,0,0),b.knee.rotation.set(Math.max(0,-Math.cos(this.phase+(b.side>0?0:Math.PI)))*.9*s+S*1.2,0,0)}}}class cc extends ws{core;shroud=new kt;wings=[];tendrils=[];color;constructor(t=12603647,e=1708072,i=1){super(),this.color=t;const n=new kt;n.scale.setScalar(i),this.root.add(n),n.add(this.shroud),this.shroud.position.y=1.1;const s=this.skin(e,.9),r=Dt(.42,.5,.42,s,14);this.shroud.add(r),this.core=Dt(.22,.22,.22,te(t),12),this.core.position.set(0,.05,.28),this.shroud.add(this.core);for(const h of[-1,1]){const l=Dt(.06,.04,.03,te(16777215),6);l.position.set(h*.14,.2,.36),this.shroud.add(l)}for(let h=0;h<5;h++){const l=h/5*Math.PI*2,c=new J($i([ae(0,0,0),ae(Math.sin(l)*.2,-.4,Math.cos(l)*.2),ae(Math.sin(l)*.1,-.9,Math.cos(l)*.1)],.12,.01,8,6),s);c.position.set(Math.sin(l)*.2,-.25,Math.cos(l)*.2),this.shroud.add(c),this.tendrils.push(c)}const o=at(2759226,{rough:.8,side:we});for(const h of[1,-1]){const l=new kt;l.position.set(h*.35,.15,-.05),l.scale.x=h;const c=new wh;c.moveTo(0,0),c.lineTo(.9,.35),c.lineTo(.75,.05),c.lineTo(.6,-.1),c.lineTo(.4,0),c.lineTo(.25,-.2),c.lineTo(0,-.15);const u=new J(new nr(c),o);l.add(u),this.shroud.add(l),this.wings.push(l)}this.root.traverse(h=>{h.isMesh&&(h.castShadow=!0)})}update(t,e){this.time+=t;const i=this.time,n=Math.sin(i*(e.state==="windup"?22:12));for(const o of this.wings)o.rotation.set(0,0,n*.7*o.scale.x);this.tendrils.forEach((o,h)=>{o.rotation.x=Math.sin(i*4+h)*.25,o.rotation.z=Math.cos(i*3+h)*.25});const s=1+Math.sin(i*8)*.08+(e.state==="windup"?e.windup*.6:0);this.core.scale.setScalar(.22*s);let r=0;e.state==="active"&&e.attack==="dive"&&(r=.8),(e.state==="hitstun"||e.state==="air")&&(r=-.6),this.shroud.rotation.x=Ft(this.shroud.rotation.x,r,10,t),this.shroud.position.y=1.1+Math.sin(i*2.5)*.08,this.color}}class dc extends ws{torso=new kt;arms=[];legs=[];core;phase=0;p={armL:0,armR:0,lean:0,back:0};scaleK;constructor(t,e,i=1,n=!1){super(),this.scaleK=i;const s=i,r=n?this.skin(t,.15):this.skin(t,.85);n&&(r.transparent=!0,r.opacity=.9,r.metalness=.1);const o=new kt;o.scale.setScalar(s),this.root.add(o),o.add(this.torso),this.torso.position.y=1.35;const h=new J(new oi(.75,0),r);h.scale.set(1.2,.95,.9),h.castShadow=!0,this.torso.add(h),this.core=Dt(.2,.2,.2,te(e),10),this.core.position.set(0,.05,.62),this.torso.add(this.core);const l=new J(new oi(.32,0),r);l.position.set(0,.85,.15),l.castShadow=!0,this.torso.add(l);for(const c of[-1,1]){const u=Dt(.07,.04,.03,te(e),6);u.position.set(c*.12,.88,.43),this.torso.add(u);const d=new kt;d.position.set(c*1,.35,0),this.torso.add(d);const f=new J(new oi(.34,0),r);f.position.y=-.2,f.castShadow=!0,d.add(f);const m=new J(new oi(.45,0),r);m.position.y=-.95,m.castShadow=!0,d.add(m);const v=new J(new oi(.28,0),r);v.position.y=-.55,d.add(v),this.arms.push(d);const p=new kt;p.position.set(c*.45,.85,0),o.add(p);const g=new J(new oi(.38,0),r);g.position.y=-.5,g.scale.set(1,1.3,1),g.castShadow=!0,p.add(g),this.legs.push(p)}if(n)for(let c=0;c<6;c++){const u=Ae(.12,.5+c%3*.15,r,5);u.position.set((c-2.5)*.25,.5,-.3),u.rotation.set(-.4,0,(c-2.5)*.25),this.torso.add(u)}}update(t,e){this.time+=t;const i=this.p;this.phase+=t*5*e.speed;let n=Math.sin(this.phase)*.4*e.speed,s=-n,r=.1,o=0;if(e.state==="windup"||e.state==="active"||e.state==="recover"){const h=le(0,1,e.windup),l=e.state==="windup"?0:e.state==="active"?le(0,.15,e.t):1,c=e.state==="recover"?1-le(0,.6,e.t):1;e.attack==="slam"?(n=s=Pt(-2.8*h,.2,l)*c,r=Pt(-.3*h,.6,l)*c):e.attack==="throw"?s=Pt(-2.6*h,-1,l)*c:(n=Pt(-1.8*h,-.2,l)*c,r=Pt(0,.4,l)*c)}e.state==="hitstun"&&(o=.25),(e.state==="down"||e.dead)&&(o=1.2),i.armL=Ft(i.armL,n,16,t),i.armR=Ft(i.armR,s,16,t),i.lean=Ft(i.lean,r,14,t),i.back=Ft(i.back,o,10,t),this.arms[0].rotation.x=i.armR,this.arms[1].rotation.x=i.armL,this.torso.rotation.x=i.lean-i.back,this.torso.position.y=1.35-i.back*.4+Math.sin(this.time*2)*.03,this.legs[0].rotation.x=Math.sin(this.phase)*.5*e.speed,this.legs[1].rotation.x=-Math.sin(this.phase)*.5*e.speed,this.core.scale.setScalar(.2*(1+Math.sin(this.time*6)*.1+(e.state==="windup"?e.windup*.5:0))),this.scaleK}}class e1 extends ws{shell=new kt;legs=[];headG=new kt;phase=0;flipK=0;constructor(t,e,i,n=1){super();const s=new kt;s.scale.setScalar(n),this.root.add(s),s.add(this.shell),this.shell.position.y=.55;const r=this.skin(t,.8),o=this.skin(e,.7),h=new J(new wi(.8,12,8,0,Math.PI*2,0,Math.PI/2),r);h.scale.set(1,.7,1.25),h.castShadow=!0,this.shell.add(h);for(let u=0;u<7;u++){const d=new J(new oi(.18+u%3*.05,0),r),f=u*.9;d.position.set(Math.sin(f)*.45,.45+u%2*.05,Math.cos(f)*.55),this.shell.add(d)}const l=Dt(.7,.2,.95,o,12);l.position.y=-.02,this.shell.add(l),this.headG.position.set(0,0,.95),this.shell.add(this.headG);const c=Dt(.32,.24,.3,o,10);this.headG.add(c);for(const u of[-1,1]){const d=Dt(.05,.05,.04,te(i),6);d.position.set(u*.14,.08,.25),this.headG.add(d);const f=new J($i([ae(0,0,0),ae(u*.12,-.02,.2),ae(u*.02,-.04,.38)],.05,.005,6,5),at(14734512));f.position.set(u*.15,-.08,.15),this.headG.add(f)}for(let u=0;u<6;u++){const d=u<3?1:-1,f=u%3,m=new kt;m.position.set(d*.6,-.05,.5-f*.5),m.add(We(ae(0,0,0),ae(d*.45,.15,0),.07,.05,o,6)),m.add(We(ae(d*.45,.15,0),ae(d*.6,-.5,.05),.05,.02,o,6)),this.shell.add(m),this.legs.push(m)}}update(t,e){this.time+=t,this.phase+=t*(6+e.speed*14),this.legs.forEach((s,r)=>{s.rotation.y=Math.sin(this.phase+r*1.3)*.35*Math.min(1,e.speed+.1),s.rotation.z=Math.cos(this.phase+r*1.3)*.15});const i=e.flipped||e.dead?1:0;this.flipK=Ft(this.flipK,i,8,t),this.shell.rotation.z=this.flipK*Math.PI,this.shell.position.y=.55+this.flipK*.2;let n=0;e.state==="windup"&&(n=-.3*e.windup),e.state==="active"&&(n=.3),this.shell.rotation.x=Ft(this.shell.rotation.x,n,12,t),this.headG.rotation.x=Math.sin(this.time*3)*.08}}class i1 extends ws{crystal;rings=[];constructor(t=11554047){super();const e=new J(new ne(.7,.9,.5,8),at(2761778,{rough:.9}));e.position.y=.25,e.castShadow=!0,e.receiveShadow=!0,this.root.add(e);const i=this.skin(3807834,.2);i.emissive.setHex(t),this.crystal=new J(new Si(.5,0),i),this.crystal.scale.set(.8,2,.8),this.crystal.position.y=1.6,this.crystal.castShadow=!0,this.root.add(this.crystal);for(let n=0;n<2;n++){const s=new J(new bi(.75+n*.2,.03,6,24),te(t,.8,!0));s.position.y=1.4+n*.5,s.rotation.x=Math.PI/2,this.root.add(s),this.rings.push(s)}}setFlash(t,e){const i=this.flashMats[0];t>.01?(i.emissive.setHex(e),i.emissiveIntensity=t):(i.emissive.setHex(11554047),i.emissiveIntensity=.6)}update(t,e){this.time+=t,this.crystal.rotation.y+=t*.8,this.crystal.position.y=1.6+Math.sin(this.time*2)*.1,this.rings.forEach((i,n)=>{i.rotation.z+=t*(n?-1.2:1.5),i.position.y=1.3+n*.5+Math.sin(this.time*3+n)*.08}),e.dead&&this.crystal.scale.multiplyScalar(.9)}}class n1 extends ws{body=new kt;wob=0;constructor(){super();const t=at(8018490,{rough:.95}),e=this.skin(14202984,.95),i=this.skin(3811414,.7),n=new J(new ne(.1,.12,1.2,6),t);n.position.y=.6,this.root.add(n),this.root.add(this.body),this.body.position.y=1.1;const s=Dt(.45,.55,.35,e,10);s.position.y=.3,this.body.add(s);const r=Dt(.32,.3,.3,i,10);r.position.y=1.05,this.body.add(r);for(const o of[-1,1]){const h=Dt(.06,.04,.03,te(16764992),6);h.position.set(o*.12,1.1,.27),this.body.add(h);const l=Ae(.07,.35,i,4);l.position.set(o*.22,1.2,0),l.rotation.z=-o*1.1,this.body.add(l);const c=new J(new ne(.06,.06,.9,5),t);c.rotation.z=Math.PI/2,c.position.set(o*.6,.55,0),this.body.add(c)}this.root.traverse(o=>{o.isMesh&&(o.castShadow=!0)})}update(t,e){this.time+=t,(e.state==="hitstun"||e.state==="air")&&(this.wob=1),this.wob=Math.max(0,this.wob-t*1.5),this.body.rotation.z=Math.sin(this.time*18)*.35*this.wob,this.body.rotation.x=Math.cos(this.time*14)*.2*this.wob}}const Dd={grunt:{id:"grunt",name:"Gloomling",hp:42,radius:.5,height:1.3,speed:4.6,turnRate:7,mass:1,poise:0,resist:{},statusResist:{},aggroRange:16,panics:!0,gems:{blue:6,red:1},attacks:[{id:"club",pose:"swing",range:2,windup:.55,active:.2,recover:.55,cooldown:1.2,weight:3,kind:"melee",damage:9,knockback:5,hitRange:1.5,hitArc:1.1,lunge:4},{id:"leap",pose:"charge",range:5.5,minRange:3.5,windup:.6,active:.35,recover:.7,cooldown:4,weight:1,kind:"melee",damage:11,knockback:7,hitRange:1.3,hitArc:1,lunge:13}],build:()=>new Ds({skin:3811414,belly:5915768,eye:16764992,scale:1,bulk:0,ears:"long",weapon:"club",offhand:"none"}),styleValue:1},slinger:{id:"slinger",name:"Gloom Slinger",hp:34,radius:.5,height:1.3,speed:4.2,turnRate:7,mass:1,poise:0,resist:{},statusResist:{},aggroRange:22,keepAway:10,panics:!0,gems:{blue:7,green:1},attacks:[{id:"bolt",pose:"throw",range:16,windup:.7,active:.1,recover:.6,cooldown:1.6,weight:3,kind:"projectile",damage:8,knockback:3,projectile:{speed:13,radius:.35,damage:8,type:"shadow",color:12603647,life:3,gravity:0}},{id:"spread",pose:"cast",range:12,windup:.9,active:.1,recover:.8,cooldown:5,weight:1,kind:"projectile",damage:6,knockback:3,projectile:{speed:11,radius:.3,damage:6,type:"shadow",color:14708991,life:2.5,gravity:0,count:3,spread:.35}}],build:()=>new Ds({skin:3023944,belly:4865128,eye:16740416,scale:.95,bulk:0,ears:"short",weapon:"staff",offhand:"none",hood:2366e3,weaponGlow:12611839}),styleValue:1.1},shieldbearer:{id:"shieldbearer",name:"Gloom Bulwark",hp:60,radius:.6,height:1.45,speed:3.6,turnRate:4.5,mass:.7,poise:20,resist:{},statusResist:{},aggroRange:16,shield:!0,gems:{blue:10,red:1},attacks:[{id:"jab",pose:"thrust",range:2.8,windup:.6,active:.2,recover:.6,cooldown:1.4,weight:3,kind:"melee",damage:10,knockback:6,hitRange:2.2,hitArc:.6,lunge:5},{id:"bash",pose:"charge",range:6,minRange:3,windup:.7,active:.45,recover:.8,cooldown:4.5,weight:1,kind:"melee",damage:12,knockback:10,hitRange:1.2,hitArc:.8,lunge:12}],build:()=>new Ds({skin:4206682,belly:6048376,eye:16764992,scale:1.08,bulk:.25,ears:"horns",weapon:"spear",offhand:"shield",armor:5921390}),styleValue:1.4},brute:{id:"brute",name:"Gloom Brute",hp:180,radius:1.1,height:2.6,speed:3.2,turnRate:3,mass:.12,poise:90,resist:{fire:1.35},statusResist:{lightning:.6,ice:.6},aggroRange:18,gems:{blue:30,red:3,purple:2},attacks:[{id:"pound",pose:"slam",range:3.4,windup:1,active:.25,recover:1,cooldown:2.5,weight:2,kind:"slam",damage:16,knockback:9,hitRange:2.2,hitArc:1.2,shockwave:{radius:8,speed:10},telegraph:!0},{id:"swipe",pose:"swing",range:3.2,windup:.7,active:.25,recover:.7,cooldown:1.6,weight:3,kind:"melee",damage:14,knockback:12,hitRange:2.6,hitArc:1.4},{id:"rush",pose:"charge",range:12,minRange:6,windup:.9,active:.9,recover:1.1,cooldown:6,weight:1,kind:"melee",damage:18,knockback:14,hitRange:1.8,hitArc:.9,lunge:13}],build:()=>new Ds({skin:2891840,belly:4469598,eye:16728112,scale:1.75,bulk:1,ears:"horns",weapon:"none",offhand:"none",cracks:12603647}),styleValue:2.5},wisp:{id:"wisp",name:"Shade Wisp",hp:30,radius:.55,height:1.4,speed:5,turnRate:5,mass:1.1,poise:0,flying:!0,hover:3.2,resist:{lightning:1.3},statusResist:{},aggroRange:20,keepAway:8,gems:{blue:8,green:2},attacks:[{id:"orb",pose:"cast",range:14,windup:.8,active:.1,recover:.8,cooldown:1.8,weight:3,kind:"projectile",damage:8,knockback:3,projectile:{speed:10,radius:.35,damage:8,type:"shadow",color:13660415,life:3,gravity:0,homing:1.2}},{id:"dive",pose:"dive",range:9,minRange:3,windup:.8,active:.6,recover:.9,cooldown:4,weight:1,kind:"dive",damage:10,knockback:6,hitRange:1.2,hitArc:1,lunge:12}],build:()=>new cc(12603647,1708072,1),styleValue:1.3},stormWisp:{id:"stormWisp",name:"Storm Wisp",hp:38,radius:.55,height:1.4,speed:5.5,turnRate:5,mass:1.1,poise:0,flying:!0,hover:3.5,resist:{lightning:0,earth:1.4},statusResist:{lightning:0},aggroRange:22,keepAway:9,gems:{blue:10,green:2},attacks:[{id:"zap",pose:"cast",range:15,windup:.7,active:.1,recover:.7,cooldown:1.6,weight:3,kind:"projectile",damage:9,knockback:3,projectile:{speed:16,radius:.3,damage:9,type:"lightning",color:11069183,life:2,gravity:0}},{id:"dive",pose:"dive",range:9,minRange:3,windup:.7,active:.6,recover:.8,cooldown:3.5,weight:1,kind:"dive",damage:11,knockback:6,hitRange:1.2,hitArc:1,lunge:13}],build:()=>new cc(10477823,1845824,1),styleValue:1.3},frostGolem:{id:"frostGolem",name:"Rime Golem",hp:150,radius:1,height:2.6,speed:2.8,turnRate:3,mass:.15,poise:70,resist:{ice:0,fire:1.6,earth:1.2},statusResist:{ice:0,fire:1.5},aggroRange:16,gems:{blue:26,red:2,green:2},attacks:[{id:"pound",pose:"slam",range:3.2,windup:1.1,active:.25,recover:1,cooldown:3,weight:2,kind:"slam",damage:15,knockback:9,hitRange:2.3,hitArc:1.2,shockwave:{radius:7,speed:9},telegraph:!0,type:"ice"},{id:"punch",pose:"punch",range:3,windup:.8,active:.25,recover:.8,cooldown:1.6,weight:3,kind:"melee",damage:13,knockback:10,hitRange:2.4,hitArc:1,lunge:3},{id:"shards",pose:"throw",range:14,minRange:5,windup:1,active:.1,recover:.9,cooldown:4,weight:1,kind:"projectile",damage:8,knockback:4,projectile:{speed:15,radius:.35,damage:8,type:"ice",color:12580095,life:2,gravity:0,count:5,spread:.3}}],build:()=>new dc(12577023,6344959,1,!0),styleValue:2.2},stoneGolem:{id:"stoneGolem",name:"Cairn Golem",hp:170,radius:1,height:2.6,speed:2.8,turnRate:3,mass:.12,poise:80,resist:{earth:.3,lightning:.7,ice:1.4,physical:.8},statusResist:{lightning:.5},aggroRange:16,gems:{blue:30,red:3},attacks:[{id:"pound",pose:"slam",range:3.2,windup:1,active:.25,recover:1,cooldown:3,weight:2,kind:"slam",damage:16,knockback:10,hitRange:2.3,hitArc:1.2,shockwave:{radius:8,speed:9},telegraph:!0},{id:"punch",pose:"punch",range:3,windup:.8,active:.25,recover:.8,cooldown:1.6,weight:3,kind:"melee",damage:14,knockback:11,hitRange:2.4,hitArc:1,lunge:3},{id:"boulder",pose:"throw",range:16,minRange:6,windup:1.1,active:.1,recover:1,cooldown:5,weight:1,kind:"projectile",damage:14,knockback:9,projectile:{speed:14,radius:.6,damage:14,type:"earth",color:9075290,life:3,gravity:14,explode:2.5}}],build:()=>new dc(9076072,10215530,1,!1),styleValue:2.2},crawler:{id:"crawler",name:"Shellback",hp:70,radius:.9,height:1.2,speed:4,turnRate:4,mass:.5,poise:0,armored:!0,resist:{},statusResist:{fire:.5},aggroRange:15,gems:{blue:14,red:1},attacks:[{id:"bite",pose:"bite",range:2.4,windup:.5,active:.2,recover:.5,cooldown:1.3,weight:3,kind:"melee",damage:10,knockback:6,hitRange:1.6,hitArc:.9,lunge:4},{id:"roll",pose:"charge",range:12,minRange:4,windup:.8,active:1,recover:.8,cooldown:5,weight:1,kind:"melee",damage:13,knockback:11,hitRange:1.2,hitArc:1.2,lunge:14}],build:()=>new e1(8022610,4864554,16756784,1),styleValue:1.6},knight:{id:"knight",name:"Shade Knight",hp:140,radius:.65,height:2,speed:4.8,turnRate:6,mass:.45,poise:45,shield:!0,resist:{shadow:0},statusResist:{fire:.7,ice:.7,lightning:.7},aggroRange:18,gems:{blue:34,red:2,purple:2},attacks:[{id:"slash",pose:"swing",range:2.8,windup:.45,active:.2,recover:.45,cooldown:1,weight:3,kind:"melee",damage:13,knockback:7,hitRange:2.2,hitArc:1.2,lunge:5},{id:"lunge",pose:"thrust",range:7,minRange:3,windup:.55,active:.35,recover:.7,cooldown:3,weight:2,kind:"melee",damage:15,knockback:9,hitRange:1.8,hitArc:.7,lunge:16},{id:"wave",pose:"cast",range:14,minRange:6,windup:.8,active:.1,recover:.8,cooldown:5,weight:1,kind:"projectile",damage:12,knockback:6,projectile:{speed:14,radius:.5,damage:12,type:"shadow",color:14704895,life:2,gravity:0,count:3,spread:.2}}],build:()=>new Ds({skin:2234928,belly:3023936,eye:16724064,scale:1.4,bulk:.35,ears:"horns",weapon:"sword",offhand:"shield",armor:3814472,weaponGlow:14704895}),styleValue:2.4},totem:{id:"totem",name:"Gloom Totem",hp:90,radius:.8,height:2.6,speed:0,turnRate:0,mass:0,poise:999,resist:{shadow:0},statusResist:{fire:0,ice:0,lightning:0},aggroRange:20,gems:{blue:20,green:3,purple:1},attacks:[{id:"pulse",pose:"cast",range:14,windup:1.2,active:.1,recover:1,cooldown:3,weight:1,kind:"projectile",damage:7,knockback:3,projectile:{speed:9,radius:.35,damage:7,type:"shadow",color:11554047,life:3,gravity:0,homing:.8}}],build:()=>new i1,styleValue:1.5},dummy:{id:"dummy",name:"Training Dummy",hp:60,radius:.55,height:2.2,speed:0,turnRate:0,mass:.05,poise:0,resist:{},statusResist:{},aggroRange:0,gems:{blue:0},attacks:[],build:()=>new n1,styleValue:.3}},s1=9,uc={};function a1(a){let t=uc[a];if(!t){switch(a){case"shard":t=new Si(1,0),t.scale(.35,.35,1.4);break;case"boulder":t=new oi(1,0);break;default:t=Rh(12)}uc[a]=t}return t}const fc=new C,rs=new C;class r1{spec;mesh;x;y;z;vx;vy;vz;age=0;alive=!0;hitSet=new Set;zapT=0;game;halo=null;reflected=!1;constructor(t,e){this.game=t,this.spec=e,this.x=e.x,this.y=e.y,this.z=e.z;const i=Math.hypot(e.dx,e.dy,e.dz)||1;this.vx=e.dx/i*e.speed,this.vy=e.dy/i*e.speed,this.vz=e.dz/i*e.speed;const n=e.kind??"orb",s=n==="boulder"?at(8022608,{rough:.9,flat:!0}):n==="shard"?at(13629183,{rough:.1,emissive:4897e3,emissiveIntensity:.6}):te(e.color,1,!0);this.mesh=new J(a1(n),s),this.mesh.scale.setScalar(n==="shard"?e.radius*.7:e.radius),n==="boulder"&&(this.mesh.castShadow=!0),n!=="boulder"&&n!=="shard"&&(this.halo=new J(Rh(10),te(e.color,.35,!0)),this.halo.scale.setScalar(2),this.mesh.add(this.halo)),this.mesh.position.set(this.x,this.y,this.z),t.scene.add(this.mesh)}update(t){const e=this.spec,i=this.game;if(this.age+=t,this.age>e.life){this.expire();return}if(e.homing){let d=null,f=0,m=0;if(e.fromPlayer){const v=i.nearestEnemy(this.x,this.y,this.z,12);v&&(d=v.x,f=v.y+v.height*.5,m=v.z)}else{const v=i.player.body;d=v.x,f=v.y+.8,m=v.z}if(d!==null&&this.age>.15){fc.set(d-this.x,f-this.y,m-this.z).normalize(),rs.set(this.vx,this.vy,this.vz);const v=rs.length();rs.normalize().lerp(fc,Math.min(1,e.homing*t)).normalize().multiplyScalar(v),this.vx=rs.x,this.vy=rs.y,this.vz=rs.z}}this.vy-=e.gravity*t;const n=this.x,s=this.y,r=this.z;this.x+=this.vx*t,this.y+=this.vy*t,this.z+=this.vz*t;const o=this.x-n,h=this.y-s,l=this.z-r,c=Math.hypot(o,h,l);if(c>1e-6){const d=i.col.raycast(n,s,r,o/c,h/c,l/c,c,!1);if(d.t<c){this.x=n+o/c*d.t,this.y=s+h/c*d.t,this.z=r+l/c*d.t,this.impact(null);return}}if(i.waterLevel>-1e3&&this.y<i.waterLevel){i.fx.splash(this.x,i.waterLevel,this.z),this.impact(null);return}if(e.fromPlayer||this.reflected){for(const d of i.hittables())if(!(!d.alive||this.hitSet.has(d))&&this.overlaps(d))if(e.pierce)this.hitSet.add(d),this.applyHit(d);else{this.impact(d);return}}else{const d=i.player,f=d.body;if(d.alive){const m=f.y+f.height*.5;if(Math.hypot(this.x-f.x,(this.y-m)*.8,this.z-f.z)<e.radius+f.radius+.1){const p=Math.hypot(this.vx,this.vz)||1;if(d.takeHit(ze({damage:e.damage*i.difficultyInfo.enemyDamage,type:e.type,dirX:this.vx/p,dirZ:this.vz/p,knockback:e.knockback??4,launch:e.launch??0,source:"enemy",move:"projectile",fromPlayer:!1,ox:this.x,oz:this.z}),null)!=="dodged"){this.impact(null);return}}}}e.zap&&(this.zapT-=t,this.zapT<=0&&(this.zapT=e.zap.interval,this.doZap())),this.mesh.position.set(this.x,this.y,this.z);const u=e.kind??"orb";(u==="shard"||u==="bolt")&&this.mesh.lookAt(this.x+this.vx,this.y+this.vy,this.z+this.vz),u==="boulder"&&(this.mesh.rotation.x+=t*8,this.mesh.rotation.z+=t*5),this.halo&&this.halo.scale.setScalar(2+Math.sin(this.age*30)*.25),this.trail()}overlaps(t){const e=t.y+t.height*.5,i=Math.max(0,Math.abs(this.y-e)-t.height*.5);return Math.hypot(this.x-t.x,i,this.z-t.z)<this.spec.radius+t.radius}trail(){const t=this.spec,e=this.game.fx,i=t.kind??"orb";i==="fireball"?(e.emit(this.x,this.y,this.z,{count:3,speed:1,life:[.2,.4],size:[t.radius*1.4,t.radius*2],sizeEnd:.2,color:16756800,colorEnd:16719872,bright:1.8,jitter:t.radius*.4}),nt.chance(.3)&&e.smoke(this.x,this.y,this.z,1)):i==="shard"?nt.chance(.5)&&e.emit(this.x,this.y,this.z,{count:1,speed:.3,life:[.2,.3],size:[.15,.25],color:13629183,bright:1.2}):i==="boulder"?nt.chance(.4)&&e.emit(this.x,this.y,this.z,{count:1,speed:.5,life:[.3,.5],size:[.3,.5],sizeEnd:1.5,color:11049080,alpha:.4,additive:!1}):e.emit(this.x,this.y,this.z,{count:1,speed:.4,life:[.2,.35],size:[t.radius*1.2,t.radius*1.6],sizeEnd:.1,color:t.color,bright:1.6})}doZap(){const e=this.spec.zap,i=this.game;let n=e.chains;const s=new C(this.x,this.y,this.z);for(const r of i.hittables()){if(!r.alive||!r.isEnemy||n<=0||Math.hypot(r.x-this.x,r.y+r.height*.5-this.y,r.z-this.z)>e.radius)continue;n--;const h=new C(r.x,r.y+r.height*.5,r.z);i.fx.arc(s,h,12577023,.1,.12,.35);const l=r.x-this.x,c=r.z-this.z,u=Math.hypot(l,c)||1;r.takeHit(ze({damage:e.damage,type:"lightning",buildup:e.buildup,dirX:l/u,dirZ:c/u,knockback:.5,stagger:6,source:"burst",move:"stormOrb",ox:this.x,oz:this.z})),i.sfx("zap",this.x,this.y,this.z,1.2,.5)}}applyHit(t){const e=this.spec,i=Math.hypot(this.vx,this.vz)||1;t.takeHit(ze({damage:e.damage,type:e.type,dirX:this.vx/i,dirZ:this.vz/i,knockback:e.knockback??3,launch:e.launch??0,stagger:e.stagger??10,buildup:e.buildup??0,heavy:e.heavy??!1,source:"burst",move:e.move??"projectile",ox:this.x-this.vx*.1,oz:this.z-this.vz*.1,hitstop:.02}))}impact(t){const e=this.spec,i=this.game;if(t&&!e.explode&&this.applyHit(t),e.explode){if(i.explode(this.x,this.y,this.z,e.explode,e.damage,e.type,e.fromPlayer||this.reflected,{buildup:e.buildup??0,knockback:e.knockback??8,launch:e.launch??4,stagger:e.stagger??30,heavy:e.heavy??!1,move:e.move??"explosion",color:e.color,burnGround:e.burnGround??!1}),e.split&&e.split>0)for(let n=0;n<e.split;n++){const s=n/e.split*Math.PI*2+nt.next();i.spawnProjectile({...e,x:this.x,y:this.y+.5,z:this.z,dx:Math.sin(s),dy:1.2,dz:Math.cos(s),speed:8,radius:e.radius*.6,damage:e.damage*.5,explode:e.explode*.7,split:0,life:1.5})}}else(e.kind??"orb")==="shard"?i.fx.sparkle(this.x,this.y,this.z,13629183,5):i.fx.hit(this.x,this.y,this.z,e.color,.6);this.kill()}expire(){if(this.spec.explode&&this.spec.fromPlayer){this.impact(null);return}this.game.fx.sparkle(this.x,this.y,this.z,this.spec.color,4),this.kill()}reflect(t,e){const i=Math.hypot(this.vx,this.vy,this.vz)*1.4;this.vx=t*i,this.vz=e*i,this.vy=0,this.reflected=!0,this.age=0,this.spec.damage*=2,this.spec.homing=3,this.spec.fromPlayer=!0}kill(){this.alive&&(this.alive=!1,this.game.scene.remove(this.mesh))}}class o1{x;y;z;r=.5;maxR;speed;damage;knockback;alive=!0;hitPlayer=!1;game;mesh;matR;constructor(t,e,i,n,s,r,o,h){this.game=t,this.x=e,this.y=i,this.z=n,this.maxR=s,this.speed=r,this.damage=o,this.knockback=h,this.matR=new si({color:16736320,transparent:!0,opacity:.9,blending:xi,depthWrite:!1,side:we});const l=new ne(1,1,.6,40,1,!0);this.mesh=new J(l,this.matR),this.mesh.position.set(e,i+.3,n),t.scene.add(this.mesh)}update(t){this.r+=this.speed*t;const e=this.r/this.maxR;if(this.mesh.scale.set(this.r,1-e*.5,this.r),this.matR.opacity=.9*(1-e),!this.hitPlayer){const i=this.game.player,n=i.body,s=Math.hypot(n.x-this.x,n.z-this.z);if(Math.abs(s-this.r)<.7&&n.y<this.y+.55&&n.y>this.y-1.5&&i.alive){this.hitPlayer=!0;const r=s||1;i.takeHit(ze({damage:this.damage,dirX:(n.x-this.x)/r,dirZ:(n.z-this.z)/r,knockback:this.knockback,launch:5,source:"enemy",move:"shockwave",fromPlayer:!1,ox:this.x,oz:this.z}),null)}}e>=1&&this.kill()}kill(){this.alive&&(this.alive=!1,this.game.scene.remove(this.mesh),this.mesh.geometry.dispose(),this.matR.dispose())}}const Hi={blue:4892927,red:16730714,green:4907130,purple:12611839},Id=new Si(.22,0);Id.scale(1,1.4,1);const pc={};function h1(a){let t=pc[a];return t||(t=new Ki({color:Hi[a],emissive:Hi[a],emissiveIntensity:.9,roughness:.15,metalness:.3,flatShading:!0}),pc[a]=t),t}class mc{kind;value;x;y;z;vx;vy;vz;age=0;alive=!0;mesh;homing=!1;autoCollect;game;settled=!1;constructor(t,e,i,n,s,r,o,h){this.game=t,this.kind=e,this.value=i,this.x=n,this.y=s,this.z=r;const l=nt.next()*Math.PI*2,c=o*(.4+nt.next()*.6);this.vx=Math.sin(l)*c,this.vz=Math.cos(l)*c,this.vy=4+nt.next()*4,this.autoCollect=h,this.mesh=new J(Id,h1(e));const u=i>=10?1.7:i>=5?1.35:1;this.mesh.scale.setScalar(u),this.mesh.position.set(n,s,r),t.scene.add(this.mesh)}update(t){const e=this.game;this.age+=t;const i=e.player,n=i.body,s=n.x,r=n.y+.7,o=n.z,h=s-this.x,l=r-this.y,c=o-this.z,u=Math.hypot(h,l,c);if(!this.homing&&this.age>.45&&i.alive&&(u<i.magnetRadius||this.autoCollect&&this.age>1.1)&&(this.homing=!0),this.homing){const d=10+this.age*12,f=Math.min(1,t*12);if(this.vx+=(h/u*d-this.vx)*f,this.vy+=(l/u*d-this.vy)*f,this.vz+=(c/u*d-this.vz)*f,this.x+=this.vx*t,this.y+=this.vy*t,this.z+=this.vz*t,u<.7){this.collect();return}}else if(!this.settled){this.vy-=22*t,this.x+=this.vx*t,this.y+=this.vy*t,this.z+=this.vz*t;const d=e.col.groundAt(this.x,this.z,this.y+.5,.05).y+.35;this.y<d&&(this.y=d,Math.abs(this.vy)<2?(this.settled=!0,this.vx=this.vy=this.vz=0):(this.vy=-this.vy*.4,this.vx*=.6,this.vz*=.6)),this.y<e.killY&&this.kill()}this.mesh.position.set(this.x,this.y+(this.settled?Math.sin(this.age*3+this.x)*.08:0),this.z),this.mesh.rotation.y+=t*3,this.age>60&&!this.homing&&this.kill()}collect(){this.game.collectGem(this.kind,this.value,this.x,this.y,this.z),this.kill()}kill(){this.alive&&(this.alive=!1,this.game.scene.remove(this.mesh))}}function l1(a){const t=[];let e=Math.round(a);for(;e>=10&&t.length<6;)t.push(10),e-=10;for(;e>=5;)t.push(5),e-=5;for(;e>0;)t.push(1),e-=1;return t}const ki=[{letter:"D",name:"Spark",at:0},{letter:"C",name:"Ember",at:120},{letter:"B",name:"Blaze",at:300},{letter:"A",name:"Wildfire",at:520},{letter:"S",name:"Inferno",at:800},{letter:"SS",name:"Legendary",at:1150}],eo=1400;class kh{points=0;combo=0;bestCombo=0;idle=0;recent=[];static COMBO_WINDOW=2.6;get rank(){let t=0;for(let e=0;e<ki.length;e++)this.points>=ki[e].at&&(t=e);return t}get progress(){const t=this.rank;if(t>=ki.length-1)return Math.min(1,(this.points-ki[t].at)/(eo-ki[t].at));const e=ki[t].at,i=ki[t+1].at;return(this.points-e)/(i-e)}get reward(){return 1+this.rank*.15}hit(t,e){const i=this.recent.filter(o=>o===t).length,n=i===0?1.25:i===1?.8:i===2?.45:.2;this.recent.push(t),this.recent.length>5&&this.recent.shift(),this.combo++,this.combo>this.bestCombo&&(this.bestCombo=this.combo),this.idle=0;const s=1+Math.min(this.combo,40)*.02,r=e*n*s;return this.points=Math.min(eo,this.points+r),r}bonus(t){this.points=Math.min(eo,this.points+t),this.idle=0}hurt(){const t=this.rank,e=t>0?ki[t-1].at:0;this.points=Math.max(0,Math.min(this.points,e+(ki[t].at-e)*.5)),t===0&&(this.points=0),this.combo=0,this.recent.length=0}update(t,e){if(this.idle+=t,this.idle>kh.COMBO_WINDOW&&(this.combo=0),this.idle>1.6){const i=e?45:120;this.points=Math.max(0,this.points-i*t)}}reset(){this.points=0,this.combo=0,this.recent.length=0,this.idle=0}}class c1{baseH=0;noiseAmp=0;noiseScale=.05;seed=1;features=[];paths=[];voidBase=!1;base(t){return this.baseH=t,this}void(){return this.voidBase=!0,this}noise(t,e=.05,i=1){return this.noiseAmp=t,this.noiseScale=e,this.seed=i,this}island(t,e,i,n,s=3,r=.3,o=1,h=1){return this.features.push({k:"island",x:t,z:e,r:i,h:n,edge:s,noise:r,sx:o,sz:h}),this}path(t,e,i=2,n=!0,s=!0){return this.features.push({k:"path",pts:t,w:e,edge:i,paint:n,raise:s}),n&&this.paths.push({pts:t,w:e}),this}trail(t,e){return this.paths.push({pts:t.map(([i,n])=>[i,n,0]),w:e}),this}mound(t,e,i,n){return this.features.push({k:"mound",x:t,z:e,r:i,h:n}),this}pit(t,e,i,n,s=2){return this.features.push({k:"pit",x:t,z:e,r:i,h:n,edge:s}),this}hole(t,e,i,n=1,s=1){return this.features.push({k:"hole",x:t,z:e,r:i,sx:n,sz:s}),this}flatten(t,e,i,n,s=2){return this.features.push({k:"flatten",x:t,z:e,r:i,h:n,edge:s}),this}ridge(t,e,i){return this.features.push({k:"ridge",pts:t,w:e,h:i}),this}height(t,e){let i=this.voidBase?Pe:this.baseH+(this.noiseAmp?Ls(t*this.noiseScale,e*this.noiseScale,4,this.seed)*this.noiseAmp:0);for(const n of this.features)switch(n.k){case"island":{const s=(t-n.x)/n.sx,r=(e-n.z)/n.sz;let o=Math.hypot(s,r);if(n.noise&&(o+=Ls(t*.15,e*.15,2,7)*n.noise*n.r*.25),o>n.r+n.edge)break;const h=n.h+(n.noise?Ls(t*.08,e*.08,3,3)*n.noise:0);if(this.voidBase&&i<=Pe)o<=n.r+n.edge*.25&&(i=h-le(n.r,n.r+n.edge*.25,o)*.6);else{const l=Pt(h,i,le(n.r,n.r+n.edge,o));l>i&&(i=l)}break}case"path":{const{d:s,y:r}=io(n.pts,t,e),o=n.w*.5;if(s>o+n.edge)break;if(this.voidBase&&i<=Pe){s<=o&&(i=r);break}const h=s<=o?r:Pt(r,i,le(o,o+n.edge,s));i=n.raise?Math.max(i,h):h;break}case"mound":{if(i<=Pe)break;const s=Math.hypot(t-n.x,e-n.z);s<n.r&&(i+=n.h*(.5+.5*Math.cos(s/n.r*Math.PI)));break}case"pit":{if(i<=Pe)break;const s=Math.hypot(t-n.x,e-n.z);s<n.r+n.edge&&(i=Pt(Math.min(i,n.h),i,le(n.r,n.r+n.edge,s)));break}case"hole":{Math.hypot((t-n.x)/n.sx,(e-n.z)/n.sz)<n.r&&(i=Pe);break}case"flatten":{if(i<=Pe)break;const s=Math.hypot(t-n.x,e-n.z);s<n.r+n.edge&&(i=Pt(n.h,i,le(n.r,n.r+n.edge,s)));break}case"ridge":{if(i<=Pe)break;const{d:s}=io(n.pts.map(([r,o])=>[r,o,0]),t,e);s<n.w&&(i+=n.h*(.5+.5*Math.cos(s/n.w*Math.PI))*(.8+.2*Ls(t*.2,e*.2,2,11)));break}}return i}pathMask(t,e){let i=0;for(const n of this.paths){const{d:s}=io(n.pts,t,e),r=n.w*.5,o=1-le(r*.6,r+.6,s+Ls(t*.4,e*.4,2,5)*.6);o>i&&(i=o)}return i}}function io(a,t,e){let i=1/0,n=0;for(let s=0;s<a.length-1;s++){const[r,o,h]=a[s],[l,c,u]=a[s+1],d=l-r,f=c-o,m=d*d+f*f;let v=m>0?((t-r)*d+(e-o)*f)/m:0;v=v<0?0:v>1?1:v;const p=r+d*v,g=o+f*v,y=Math.hypot(t-p,e-g);y<i&&(i=y,n=h+(u-h)*v)}return a.length===1&&(i=Math.hypot(t-a[0][0],e-a[0][1]),n=a[0][2]),{d:i,y:n}}function d1(a,t){const{nx:e,nz:i,cell:n,x0:s,z0:r}=a,o=new Float32Array(e*i*3),h=new Float32Array(e*i*3),l=new Nt;for(let v=0;v<i;v++)for(let p=0;p<e;p++){const g=v*e+p;let y=a.vertex(p,v);y<=Pe&&(y=-30);const x=s+p*n,S=r+v*n;o[g*3]=x,o[g*3+1]=y,o[g*3+2]=S;const T=a.vertex(p-1,v),R=a.vertex(p+1,v),M=a.vertex(p,v-1),E=a.vertex(p,v+1),L=(R>Pe&&T>Pe?R-T:0)/(2*n),N=(E>Pe&&M>Pe?E-M:0)/(2*n),k=Math.hypot(L,N);l.setHex(t(x,S,y,k)),h[g*3]=l.r,h[g*3+1]=l.g,h[g*3+2]=l.b}const c=[],u=(v,p)=>a.vertex(v,p)<=Pe;for(let v=0;v<i-1;v++)for(let p=0;p<e-1;p++){const g=v*e+p,y=v*e+p+1,b=(v+1)*e+p,x=(v+1)*e+p+1;!u(p,v)&&!u(p+1,v)&&!u(p,v+1)&&c.push(g,b,y),!u(p+1,v+1)&&!u(p+1,v)&&!u(p,v+1)&&c.push(y,b,x)}const d=new Se;d.setAttribute("position",new qe(o,3)),d.setAttribute("color",new qe(h,3)),d.setIndex(c),d.computeVertexNormals(),d.computeBoundingSphere();const f=new Ki({vertexColors:!0,roughness:.95,metalness:0}),m=new J(d,f);return m.receiveShadow=!0,m}function u1(a,t,e){const{nx:i,nz:n,cell:s,x0:r,z0:o}=a,h=[],l=(f,m)=>a.vertex(f,m)<=Pe,c=(f,m,v,p)=>{const g=r+f*s,y=o+m*s,b=r+v*s,x=o+p*s,S=a.vertex(f,m),T=a.vertex(v,p),R=(M,E)=>t*(.6+.4*Math.abs(Math.sin(M*1.7+E*2.3)));h.push(g,S,y,b,T,x,b,T-R(b,x),x),h.push(g,S,y,b,T-R(b,x),x,g,S-R(g,y),y)};for(let f=0;f<n;f++)for(let m=0;m<i;m++)if(!l(m,f)){if(m+1<i&&!l(m+1,f)){const v=f+1>=n||l(m,f+1)||l(m+1,f+1),p=f-1<0||l(m,f-1)||l(m+1,f-1);v&&c(m+1,f,m,f),p&&c(m,f,m+1,f)}if(f+1<n&&!l(m,f+1)){const v=m+1>=i||l(m+1,f)||l(m+1,f+1),p=m-1<0||l(m-1,f)||l(m-1,f+1);v&&c(m,f,m,f+1),p&&c(m,f+1,m,f)}}if(h.length===0)return null;const u=new Se;u.setAttribute("position",new Jt(h,3)),u.computeVertexNormals();const d=new Ki({color:e,roughness:1,side:we,flatShading:!0});return new J(u,d)}const f1=`
#include <common>
#include <fog_pars_vertex>
uniform float uTime;
varying vec3 vWorld;
varying float vWave;
void main() {
  vec3 p = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  float wave = sin(w.x * 0.35 + uTime * 1.3) * 0.5 + sin(w.z * 0.42 - uTime * 1.1) * 0.5;
  w.y += wave * 0.12;
  vWave = wave;
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,p1=`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uGlint;
uniform float uTime;
uniform float uOpacity;
varying vec3 vWorld;
varying float vWave;
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(v.y, 0.0), 3.0);
  vec3 col = mix(uDeep, uShallow, 0.35 + 0.35 * vWave);
  col = mix(col, uGlint, fres * 0.6);
  float r = sin(vWorld.x * 1.9 + uTime * 2.0) * sin(vWorld.z * 2.3 - uTime * 1.7);
  col += uGlint * smoothstep(0.85, 1.0, r) * 0.35;
  gl_FragColor = vec4(col, mix(uOpacity, 1.0, fres * 0.5));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;class Nd{mesh;uniforms;constructor(t,e,i,n,s,r=.82){this.uniforms=ps.merge([ft.fog,{uTime:{value:0},uDeep:{value:new Nt(i)},uShallow:{value:new Nt(n)},uGlint:{value:new Nt(s)},uOpacity:{value:r}}]);const o=new Be({uniforms:this.uniforms,vertexShader:f1,fragmentShader:p1,transparent:!0,fog:!0,depthWrite:!1}),h=new Tn(e,e,96,96);h.rotateX(-Math.PI/2),this.mesh=new J(h,o),this.mesh.position.y=t,this.mesh.renderOrder=5}update(t,e,i){this.uniforms.uTime.value=t,this.mesh.position.x=Math.round(e/8)*8,this.mesh.position.z=Math.round(i/8)*8}}const gc={};function Je(a,t){let e=gc[a];return e||(e=t(),gc[a]=e),e}const Bi=(a,t,e)=>new C(a,t,e),jt={trunk:()=>Je("trunk",()=>{const a=new ne(.22,.34,1,7,1);return a.translate(0,.5,0),a}),blob:()=>Je("blob",()=>new Qs(1,1)),blobLow:()=>Je("blobLow",()=>new Qs(1,0)),cone:()=>Je("cone",()=>{const a=new cn(1,1,8,1);return a.translate(0,.5,0),a}),rock:()=>Je("rock",()=>new oi(1,0)),cyl:()=>Je("cyl",()=>{const a=new ne(1,1,1,10,1);return a.translate(0,.5,0),a}),cyl6:()=>Je("cyl6",()=>{const a=new ne(1,1,1,6,1);return a.translate(0,.5,0),a}),box:()=>Je("box",()=>new ke(1,1,1)),cap:()=>Je("cap",()=>new wi(1,14,8,0,Math.PI*2,0,Math.PI/2)),blade:()=>Je("blade",()=>{const a=new cn(.05,1,3,1);return a.translate(0,.5,0),a}),disc:()=>Je("disc",()=>{const a=new ys(1,12,.3,Math.PI*2-.6);return a.rotateX(-Math.PI/2),a}),octa:()=>Je("octa",()=>new Si(1,0)),willowTrunk:()=>Je("willowTrunk",()=>$i([Bi(0,0,0),Bi(.3,1.2,.1),Bi(-.1,2.4,.2),Bi(.2,3.4,-.1)],.35,.14,10,7,!1)),deadTrunk:()=>Je("deadTrunk",()=>$i([Bi(0,0,0),Bi(.1,1.5,0),Bi(-.2,3,.1)],.28,.06,8,6)),branch:()=>Je("branch",()=>$i([Bi(0,0,0),Bi(.5,.4,0),Bi(1.1,.9,.1)],.1,.02,6,5)),strand:()=>Je("strand",()=>{const a=new ne(.04,.01,1,4,1);return a.translate(0,-.5,0),a})};new pe;const vc=new Gn,xc=new ln,yc=new C,_c=new C;class m1{batches=new Map;rng;constructor(t=7){this.rng=new _d(t)}add(t,e,i,n,s,r,o,h,l=0,c=0,u=0,d=!0){const f=`${t.uuid}|${e.uuid}`;let m=this.batches.get(f);m||(m={geo:t,mat:e,mats:[],cast:d},this.batches.set(f,m)),xc.set(l,c,u),vc.setFromEuler(xc),yc.set(i,n,s),_c.set(r,o,h),m.mats.push(new pe().compose(yc,vc,_c))}build(t){for(const e of this.batches.values()){const i=new ef(e.geo,e.mat,e.mats.length);e.mats.forEach((n,s)=>i.setMatrixAt(s,n)),i.instanceMatrix.needsUpdate=!0,i.castShadow=e.cast,i.receiveShadow=!0,i.computeBoundingSphere(),t.add(i)}this.batches.clear()}tree(t,e,i,n,s,r){const o=this.rng,h=n*(.85+o.next()*.3),l=o.next()*Math.PI*2,c=at(r?.bark??5914154,{rough:.95});switch(s){case"round":case"autumn":{const u=r?.leaf??(s==="autumn"?14187050:5937730),d=at(u,{rough:.9,flat:!0,emissive:u,emissiveIntensity:.12}),f=2.4*h;this.add(jt.trunk(),c,t,e,i,h,f,h,0,l,0),this.add(jt.blob(),d,t,e+f+1*h,i,1.9*h,1.6*h,1.9*h,0,l,0),this.add(jt.blob(),d,t+.9*h,e+f+.4*h,i+.3*h,1.2*h,1*h,1.2*h,0,l,0),this.add(jt.blob(),d,t-.7*h,e+f+.6*h,i-.5*h,1.3*h,1.1*h,1.3*h,0,l,0);break}case"willow":{const u=r?.leaf??4880960,d=at(u,{rough:.9,flat:!0,emissive:u,emissiveIntensity:.12}),f=at(u,{rough:.9,emissive:u,emissiveIntensity:.15});this.add(jt.willowTrunk(),c,t,e,i,h,h,h,0,l,0);const m=e+3.4*h;this.add(jt.blob(),d,t+.2*h,m,i,2.4*h,1.2*h,2.4*h,0,l,0);for(let v=0;v<10;v++){const p=v/10*Math.PI*2+o.next()*.3,g=1.8*h+o.next()*.4;this.add(jt.strand(),f,t+Math.sin(p)*g,m-.2,i+Math.cos(p)*g,h*1.5,(1.5+o.next()*1.5)*h,h*1.5,0,0,0,!1)}break}case"pine":case"snowPine":{const u=r?.leaf??3103290,d=at(u,{rough:.9,flat:!0,emissive:u,emissiveIntensity:.1}),f=at(15923199,{rough:.8,flat:!0});this.add(jt.trunk(),c,t,e,i,h*.7,1.4*h,h*.7,0,l,0);for(let m=0;m<3;m++){const v=(1.9-m*.5)*h,p=e+(1+m*1.1)*h;this.add(jt.cone(),d,t,p,i,v,1.8*h,v,0,l+m,0),s==="snowPine"&&this.add(jt.cone(),f,t,p+.9*h,i,v*.55,.9*h,v*.55,0,l+m,0,!1)}break}case"dead":{const u=at(r?.bark??4864560,{rough:1});this.add(jt.deadTrunk(),u,t,e,i,h,h,h,0,l,0);for(let d=0;d<3;d++)this.add(jt.branch(),u,t,e+(1.4+d*.6)*h,i,h,h,h,0,l+d*2.1,0);break}case"crystal":{const u=r?.leaf??10477823,d=at(u,{rough:.15,metal:.1,emissive:u,emissiveIntensity:.35,flat:!0});this.add(jt.octa(),d,t,e+1.6*h,i,.6*h,2*h,.6*h,.1,l,.1),this.add(jt.octa(),d,t+.6*h,e+.9*h,i,.4*h,1.2*h,.4*h,0,l,-.4),this.add(jt.octa(),d,t-.5*h,e+.7*h,i+.3*h,.35*h,1*h,.35*h,.3,l,.4);break}}}mushroom(t,e,i,n,s,r=!1){const o=this.rng,h=n*(.8+o.next()*.4),l=at(15260864,{rough:.9}),c=r?at(s,{rough:.6,emissive:s,emissiveIntensity:.55}):at(s,{rough:.7}),u=1.2*h,d=o.signed()*.15;this.add(jt.cyl(),l,t,e,i,.18*h,u,.18*h,d,0,d),this.add(jt.cap(),c,t+Math.sin(d)*u*.2,e+u,i,.8*h,.5*h,.8*h,0,o.next()*6,0);const f=at(16774364,{rough:.8,emissive:r?16773312:0,emissiveIntensity:.3});for(let m=0;m<4;m++){const v=o.next()*Math.PI*2,p=.45*h;this.add(jt.blobLow(),f,t+Math.sin(v)*p,e+u+.3*h,i+Math.cos(v)*p,.09*h,.05*h,.09*h,0,0,0,!1)}}rock(t,e,i,n,s=8221798){const r=this.rng,o=at(s,{rough:.95,flat:!0});this.add(jt.rock(),o,t,e+n*.35,i,n*(.8+r.next()*.5),n*(.5+r.next()*.4),n*(.8+r.next()*.5),r.next(),r.next()*6,r.next())}grass(t,e,i,n,s=6989898){const r=this.rng,o=at(s,{rough:1,emissive:s,emissiveIntensity:.18}),h=5+r.int(0,4);for(let l=0;l<h;l++)this.add(jt.blade(),o,t+r.signed()*.3*n,e-.02,i+r.signed()*.3*n,n*1.6,n*(.28+r.next()*.3),n*1.6,r.signed()*.5,r.next()*6,r.signed()*.5,!1)}reeds(t,e,i,n){const s=this.rng,r=at(8030794,{rough:1}),o=at(6965802,{rough:1}),h=3+s.int(0,3);for(let l=0;l<h;l++){const c=t+s.signed()*.4*n,u=i+s.signed()*.4*n,d=(1.2+s.next()*.8)*n,f=s.signed()*.12;this.add(jt.cyl6(),r,c,e,u,.025,d,.025,f,0,f,!1),this.add(jt.cyl6(),o,c+Math.sin(f)*d,e+d*.95,u,.06,.3*n,.06,f,0,f,!1)}}flower(t,e,i,n){const s=this.rng,r=at(5933626,{rough:1}),o=at(n,{rough:.8,emissive:n,emissiveIntensity:.1}),h=.3+s.next()*.25;this.add(jt.cyl6(),r,t,e,i,.015,h,.015,0,0,0,!1),this.add(jt.blobLow(),o,t,e+h,i,.09,.06,.09,0,s.next()*6,0,!1)}lilypad(t,e,i,n){this.add(jt.disc(),at(4885050,{rough:.8,side:we}),t,e+.02,i,n,1,n,0,this.rng.next()*6,0,!1)}glowCrystal(t,e,i,n,s){const r=this.rng,o=te(s);for(let h=0;h<3;h++)this.add(jt.octa(),o,t+r.signed()*.3*n,e+.3*n,i+r.signed()*.3*n,.15*n,(.4+r.next()*.4)*n,.15*n,r.signed()*.4,r.next()*6,r.signed()*.4,!1)}pillar(t,e,i,n,s,r=12103064,o=!1){const h=at(r,{rough:.9,flat:!0});this.add(jt.cyl6(),h,t,e,i,n*1.25,.4,n*1.25,0,.3,0),this.add(jt.cyl6(),h,t,e+.4,i,n,s-(o?.4:.8),n,0,0,0),o?this.add(jt.rock(),h,t+n,e+.2,i+n*.6,n*.6,n*.4,n*.5,.3,.2,.1):this.add(jt.cyl6(),h,t,e+s-.4,i,n*1.25,.4,n*1.25,0,.3,0)}lantern(t,e,i,n=16760944){const s=at(3812900,{rough:.9});this.add(jt.cyl6(),s,t,e,i,.07,2.2,.07),this.add(jt.box(),s,t+.25,e+2.15,i,.55,.06,.06),this.add(jt.blobLow(),te(n),t+.45,e+1.9,i,.14,.2,.14,0,0,0,!1)}}const Vs=(a,t,e)=>new C(a,t,e);class g1{constructor(t,e,i,n,s,r,o=!1){this.game=t,this.kind=s,this.value=r,this.x=e,this.y=i,this.z=n,this.radius=o?.9:.6,this.height=o?1.8:1.1,this.hp=o?3:1;const h=s==="mixed"?[Hi.blue,Hi.red,Hi.green,Hi.purple]:[Hi[s]],l=new J(new oi(this.radius*.7,0),at(5918792,{rough:1,flat:!0}));l.scale.y=.4,l.position.y=.1,l.receiveShadow=!0,this.mesh.add(l);const c=o?7:5;for(let u=0;u<c;u++){const d=h[u%h.length],f=at(d,{rough:.15,metal:.2,emissive:d,emissiveIntensity:.5,flat:!0}),m=new J(new Si(1,0),f),v=u/c*Math.PI*2,p=u===0?0:this.radius*.45,g=(u===0?.32:.2+nt.next()*.1)*(o?1.5:1);m.scale.set(g,g*2.4,g),m.position.set(Math.sin(v)*p,g*2.2,Math.cos(v)*p),m.rotation.set(Math.sin(v)*.4,nt.next()*3,Math.cos(v)*.4),m.castShadow=!0,this.mesh.add(m)}this.mesh.position.set(e,i,n),t.level.root.add(this.mesh),o&&(this.solid=hi(e,n,this.radius*.8,i-.5,i+1.2),t.col.add(this.solid))}game;kind;value;isEnemy=!1;alive=!0;x;y;z;radius;height;hp;mesh=new kt;wobble=0;solid=null;takeHit(t){if(!this.alive)return"none";this.hp-=t.damage>=8||t.heavy?1:.34,this.wobble=.3;const e=this.game;return e.fx.sparkle(this.x,this.y+this.height*.6,this.z,this.kind==="mixed"?16777215:Hi[this.kind],6),e.sfx("crystalBreak",this.x,this.y,this.z,1.5,.35),this.hp<=0&&this.shatter(),"hit"}shatter(){this.alive=!1;const t=this.game,e=this.kind==="mixed"?16777215:Hi[this.kind];t.fx.shatter(this.x,this.y+.6,this.z,e),t.sfx("crystalBreak",this.x,this.y,this.z),this.kind==="mixed"?t.spawnGems(this.x,this.y+.8,this.z,{blue:this.value,red:2,green:2,purple:1},!1):t.spawnGems(this.x,this.y+.8,this.z,{[this.kind]:this.value},!1),this.game.level.root.remove(this.mesh),this.solid&&this.game.col.remove(this.solid)}update(t){this.alive&&this.wobble>0&&(this.wobble-=t,this.mesh.rotation.z=Math.sin(this.wobble*60)*this.wobble*.4)}}class v1{constructor(t,e,i,n,s,r=!1,o=0){this.game=t,this.x=e,this.y=i,this.z=n,this.group=s,this.burnTime=o,this.lit=r;const h=new kt,l=at(9077362,{rough:.9,flat:!0}),c=new J(new ne(.22,.32,1.5,6),l);c.position.y=.75,c.castShadow=!0,h.add(c);const u=new J(new ne(.5,.25,.4,8),at(5917242,{rough:.6,metal:.4}));u.position.y=1.7,u.castShadow=!0,h.add(u),this.flame=new J(new wi(.3,10,8),te(16752704,.9,!0)),this.flame.position.y=2.05,h.add(this.flame),h.position.set(e,i,n),t.level.root.add(h),t.col.add(hi(e,n,.35,i,i+1.9)),this.flame.visible=r}game;x;y;z;group;burnTime;isEnemy=!1;alive=!0;radius=.6;height=2.2;lit;flameT=0;flame;litFor=0;takeHit(t){return t.type==="fire"&&!this.lit?(this.light(),"hit"):(t.type==="ice"&&this.lit&&this.burnTime===0,"none")}light(){this.lit=!0,this.litFor=0,this.flame.visible=!0;const t=this.game;t.sfx("torch",this.x,this.y,this.z),t.fx.explosion(this.x,this.y+2,this.z,.8,16756816),t.level.torchLit(this.group)}update(t){if(!this.lit)return;this.flameT-=t,this.litFor+=t;const e=1+Math.sin(this.game.time*14+this.x)*.15;this.flame.scale.set(e,e*1.3,e),this.flameT<=0&&(this.flameT=.06,this.game.fx.emit(this.x,this.y+2.05,this.z,{count:2,speed:1.2,dir:[0,1.6,0],spread:.4,life:[.3,.6],size:[.4,.6],sizeEnd:.1,color:16760928,colorEnd:16723984,bright:1.8,gravity:-2,jitter:.15})),this.burnTime>0&&this.litFor>this.burnTime&&!this.game.level.groupDone(this.group)&&(this.lit=!1,this.flame.visible=!1,this.game.fx.smoke(this.x,this.y+2,this.z,6),this.game.level.torchOut(this.group))}}const x1={stone:"",vines:"Thorny vines. Fire would clear them.",ice:"A wall of solid ice. It needs heat.",rock:"Cracked stone. Something heavy and earthen could break it.",wood:"A barricade. Charge through it or smash it.",shadow:"Shadow seals this way."};class y1{constructor(t,e,i,n,s,r,o,h,l){this.game=t,this.x=e,this.z=n,this.w=s,this.h=r,this.kind=h,this.signal=l,this.y=i,this.radius=s*.5,this.height=r,this.hp=h==="ice"||h==="rock"?40:h==="wood"?24:1,this.solid=On(e,n,s*.5,.6,i-1,i+r,o),t.col.add(this.solid),this.build(),this.root.position.set(e,i,n),this.root.rotation.y=o,t.level.root.add(this.root),l&&t.level.on(l,()=>this.open())}game;x;z;w;h;kind;signal;isEnemy=!1;alive=!0;radius;height;solid;root=new kt;opening=-1;hp;hintT=0;y;build(){const{w:t,h:e}=this;switch(this.kind){case"stone":{const i=at(8025192,{rough:.9,flat:!0}),n=new J(new ke(t,e,.9),i);n.position.y=e/2,n.castShadow=n.receiveShadow=!0,this.root.add(n);const s=new J(new bi(Math.min(t,e)*.22,.06,6,20),te(16106603));s.position.set(0,e*.55,.47),this.root.add(s);const r=s.clone();r.position.z=-.47,this.root.add(r);break}case"vines":{const i=yi(3828266,{rough:.9});for(let s=0;s<14;s++){const r=(nt.next()-.5)*t,o=(nt.next()-.5)*t,h=new J($i([Vs(r,0,0),Vs((r+o)/2+nt.signed(),e*.5,nt.signed()*.2),Vs(o,e,0)],.12,.06,10,5,!1),i);if(h.castShadow=!0,this.root.add(h),s%2===0){const l=Ae(.06,.3,at(6965802),4);l.position.set((r+o)/2,e*nt.next(),.1),l.rotation.x=Math.PI/2,this.root.add(l)}}const n=new J(new Tn(t,e),at(1714708,{rough:1,side:we,transparent:!0,opacity:.7}));n.position.y=e/2,this.root.add(n);break}case"ice":{const i=yi(12578815,{rough:.1,metal:.1,transparent:!0,opacity:.75,emissive:3842256,emissiveIntensity:.2,flat:!0}),n=new J(new ke(t,e,1.1),i);n.position.y=e/2,this.root.add(n);for(let s=0;s<6;s++){const r=new J(new Si(.6+nt.next()*.5,0),i);r.position.set((nt.next()-.5)*t,nt.next()*e,(nt.next()-.5)*.8),r.scale.y=1.6,this.root.add(r)}break}case"rock":{const i=at(6971472,{rough:1,flat:!0});for(let n=0;n<9;n++){const s=new J(new oi(.7+nt.next()*.4,0),i);s.position.set((n%3-1)*t*.33,.6+Math.floor(n/3)*e*.33,0),s.castShadow=!0,this.root.add(s)}for(let n=0;n<4;n++){const s=new J(new ke(.08,e*.35,.05),te(10215530));s.position.set((n-1.5)*t*.22,e*(.3+n%2*.3),.72),s.rotation.z=(n-1.5)*.5,this.root.add(s)}break}case"wood":{const i=at(8018490,{rough:.95});for(let n=0;n<5;n++){const s=new J(new ke(.35,e,.3),i);s.position.set((n-2)*(t/5),e/2,0),s.rotation.z=nt.signed()*.05,s.castShadow=!0,this.root.add(s)}for(const n of[e*.3,e*.75]){const s=new J(new ke(t,.3,.2),i);s.position.set(0,n,.25),s.rotation.z=.15,this.root.add(s)}break}case"shadow":{const i=new si({color:9453823,transparent:!0,opacity:.45,blending:xi,side:we,depthWrite:!1}),n=new J(new Tn(t,e),i);n.position.y=e/2,this.root.add(n);break}}}takeHit(t){if(!this.alive||this.opening>=0)return"none";const e=this.game;let i=0;return this.kind==="vines"&&t.type==="fire"&&(i=999),this.kind==="ice"&&t.type==="fire"&&(i=t.damage),this.kind==="rock"&&t.type==="earth"&&(t.heavy||t.source==="burst")&&(i=t.damage),this.kind==="wood"&&(t.heavy||t.source==="charge"||t.type==="fire"||t.type==="earth")&&(i=Math.max(t.damage,8)),i<=0?(this.kind!=="stone"&&this.kind!=="shadow"&&(this.hintT-=1,this.hintT<=0&&(this.hintT=6,e.toast(x1[this.kind],"hint"))),this.kind==="stone"||this.kind==="shadow"?"none":"immune"):(this.hp-=i,this.kind==="ice"&&e.fx.emit(this.x,this.y+this.h*.5,this.z,{count:4,speed:2,dir:[0,1,0],life:[.5,.9],size:[.5,.8],sizeEnd:2,color:15792383,alpha:.5,additive:!1}),this.hp<=0&&(this.kind==="vines"?(e.fx.explosion(this.x,this.y+this.h*.4,this.z,1.5,16747056),e.sfx("fireBurst",this.x,this.y,this.z)):this.kind==="ice"?(e.fx.shatter(this.x,this.y+this.h*.5,this.z),e.sfx("shatter",this.x,this.y,this.z)):(e.fx.rocks(this.x,this.y+this.h*.5,this.z,20,this.kind==="wood"?8018490:6971472),e.sfx("rumble",this.x,this.y,this.z),e.shake(.3,.3)),this.break()),"hit")}break(){this.alive=!1,this.solid.enabled=!1,this.game.level.root.remove(this.root),this.signal&&this.game.level.emit(`broken:${this.signal}`)}open(){this.opening>=0||!this.alive||(this.opening=0,this.game.sfx("door",this.x,this.y,this.z),this.game.shake(.15,.8))}close(){this.opening=-1,this.alive=!0,this.solid.enabled=!0,this.root.position.y=this.y,this.root.visible=!0}update(t){if(this.opening>=0&&this.alive){this.opening+=t;const e=Math.min(1,this.opening/1.4);this.root.position.y=this.y-e*(this.h+.2),this.opening%.1<t&&this.game.fx.dust(this.x,this.y,this.z,3),e>=1&&(this.solid.enabled=!1,this.alive=!1,this.root.visible=!1)}this.kind==="shadow"&&this.root.children.forEach(e=>e.rotation.y=Math.sin(this.game.time)*.02)}}class _1{constructor(t,e,i,n,s,r){this.game=t,this.x=e,this.y=i,this.z=n,this.kind=s,this.signal=r;const o=new kt,h=new J(new ne(.6,.8,.6,8),at(5920356,{rough:.9,flat:!0}));h.position.y=.3,h.castShadow=!0,o.add(h);const l=s==="lightning"?2767450:s==="fire"?5909018:4868666;this.cm=yi(l,{rough:.2,metal:.2,flat:!0}),this.crystal=new J(new Si(.5,0),this.cm),this.crystal.scale.y=1.8,this.crystal.position.y=1.5,this.crystal.castShadow=!0,o.add(this.crystal),o.position.set(e,i,n),t.level.root.add(o),t.col.add(hi(e,n,.6,i,i+.6))}game;x;y;z;kind;signal;isEnemy=!1;alive=!0;radius=.7;height=2;on=!1;crystal;cm;takeHit(t){if(this.on)return"none";if(!(this.kind==="strike"?t.source==="melee"||t.source==="charge":t.type===this.kind))return this.kind==="lightning"&&this.game.toast("The crystal is dark. It wants a spark.","hint"),"none";this.on=!0;const i=this.kind==="lightning"?11069183:this.kind==="fire"?16747056:16106603;return this.cm.color.setHex(i),this.cm.emissive.setHex(i),this.cm.emissiveIntensity=.9,this.game.sfx("switch",this.x,this.y,this.z),this.game.fx.ring(this.x,this.y+.2,this.z,.3,3,i,.5),this.game.level.emit(this.signal),"hit"}update(t){if(this.crystal.rotation.y+=t*(this.on?2:.3),this.on&&this.kind==="lightning"&&nt.chance(.08)){const e=Vs(this.x,this.y+1.5,this.z),i=Vs(this.x+nt.signed(),this.y+1+nt.next(),this.z+nt.signed());this.game.fx.arc(e,i,12577023,.04,.08,.5)}}}class M1{constructor(t,e,i,n,s){this.game=t,this.x=e,this.y=i,this.z=n,this.signal=s;const r=new J(new ne(1.4,1.5,.2,12),at(6972504,{rough:.9}));r.position.set(e,i+.1,n),r.receiveShadow=!0,t.level.root.add(r),this.top=new J(new ne(1.1,1.1,.25,12),yi(11049064,{rough:.6,emissive:16106603,emissiveIntensity:.15})),this.top.position.set(e,i+.25,n),t.level.root.add(this.top),t.level.onSlam((o,h,l)=>{this.pressed||Math.hypot(o-e,l-n)<1.6&&Math.abs(h-i)<1&&this.press()})}game;x;y;z;signal;pressed=!1;top;press(){this.pressed=!0,this.top.position.y=this.y+.08,this.top.material.emissiveIntensity=.9,this.game.sfx("switch",this.x,this.y,this.z,.7),this.game.level.emit(this.signal)}update(){}}class w1{constructor(t,e,i,n,s,r,o=0,h="",l=.6){this.pts=e,this.speed=s,this.spin=o,this.pause=l;const c=e[0];this.solid=On(c.x,c.z,i/2,n/2,c.y-.5,c.y),this.solid.dynamic=!0,this.solid.surface="stone",t.col.add(this.solid);const u=at(r,{rough:.85,flat:!0}),d=new ke(i,.5,n);this.mesh=new J(d,u),this.mesh.castShadow=this.mesh.receiveShadow=!0;const f=new J(new ke(i+.1,.1,n+.1),te(16106603,.8));f.position.y=-.2,this.mesh.add(f),this.mesh.position.set(c.x,c.y-.25,c.z),t.level.root.add(this.mesh),this.active=!h,h&&t.level.on(h,()=>this.active=!0)}pts;speed;spin;pause;solid;mesh;t=0;active;seg=0;update(t){const e=this.solid,i=e.x,n=e.y1,s=e.z,r=e.yaw;if(e.dx=e.dy=e.dz=e.dyaw=0,!!this.active){if(this.pts.length>1){const o=this.pts[this.seg],h=this.pts[(this.seg+1)%this.pts.length],c=o.distanceTo(h)/this.speed;this.t+=t;let u=Math.min(1,this.t/c);u=u*u*(3-2*u);const d=o.x+(h.x-o.x)*u,f=o.y+(h.y-o.y)*u,m=o.z+(h.z-o.z)*u;this.t>=c+this.pause&&(this.t=0,this.seg=(this.seg+1)%this.pts.length),e.x=d,e.z=m,e.y1=f,e.y0=f-.5}this.spin&&e.setYaw(e.yaw+this.spin*t),e.dx=e.x-i,e.dy=e.y1-n,e.dz=e.z-s,e.dyaw=e.yaw-r,this.mesh.position.set(e.x,e.y1-.25,e.z),this.mesh.rotation.y=e.yaw}}}class b1{constructor(t,e,i,n,s,r){this.game=t,this.x=e,this.y=i,this.z=n,this.solid=On(e,n,s/2,r/2,i-.6,i),t.col.add(this.solid),this.mesh=new J(new ke(s,.6,r),yi(10127978,{rough:1,flat:!0})),this.mesh.position.set(e,i-.3,n),this.mesh.castShadow=this.mesh.receiveShadow=!0,t.level.root.add(this.mesh),this.solid.onStand=()=>{this.timer<0&&this.down<=0&&(this.timer=0)}}game;x;y;z;solid;mesh;timer=-1;down=0;update(t){this.timer>=0&&(this.timer+=t,this.mesh.position.x=this.x+Math.sin(this.timer*60)*.05,this.timer>.7&&(this.timer=-1,this.down=4,this.solid.enabled=!1,this.game.fx.rocks(this.x,this.y,this.z,10,10127978),this.game.sfx("rumble",this.x,this.y,this.z,1.4,.5))),this.down>0&&(this.down-=t,this.mesh.position.y-=t*8,this.down<=0&&(this.solid.enabled=!0,this.mesh.position.set(this.x,this.y-.3,this.z),this.game.fx.sparkle(this.x,this.y,this.z,16106603,8))),this.mesh.visible=this.down<=0||this.down>3}}class S1{constructor(t,e,i,n,s,r,o=34){this.game=t,this.x=e,this.y0=i,this.z=n,this.r=s,this.y1=r,this.strength=o}game;x;y0;z;r;y1;strength;fxT=0;contains(t,e,i){return e>this.y0-1&&e<this.y1&&Math.hypot(t-this.x,i-this.z)<this.r}update(t){if(this.fxT-=t,this.fxT<=0){this.fxT=.05;const e=nt.next()*Math.PI*2,i=nt.next()*this.r;this.game.fx.emit(this.x+Math.sin(e)*i,this.y0,this.z+Math.cos(e)*i,{count:1,speed:9,dir:[0,1,0],spread:.05,life:[(this.y1-this.y0)/10,(this.y1-this.y0)/8],size:[.1,.18],sizeEnd:.5,color:15267071,alpha:.7,additive:!0,bright:.8,drag:0})}}}class T1{constructor(t,e,i,n,s=18,r=16734874){this.x=e,this.y=i,this.z=n,this.power=s,this.cap=new kt;const o=new J(new ne(.35,.5,1.2,8),at(15260864));o.position.y=.6,o.castShadow=!0;const h=new J(new wi(1.4,16,8,0,Math.PI*2,0,Math.PI/2),at(r,{rough:.5,emissive:r,emissiveIntensity:.35}));h.scale.y=.55,h.castShadow=!0,this.cap.add(h),this.cap.position.y=1.2;const l=new kt;l.add(o,this.cap);for(let u=0;u<6;u++){const d=Dt(.16,.08,.16,at(16774364,{emissive:16773312,emissiveIntensity:.4}),6),f=u/6*Math.PI*2;d.position.set(Math.sin(f)*.8,.55,Math.cos(f)*.8),this.cap.add(d)}l.position.set(e,i,n),t.level.root.add(l);const c=hi(e,n,1.3,i,i+1.9);c.surface="mud",c.onStand=u=>{u===t.player.body&&(t.player.body.vy=this.power,t.player.body.grounded=!1,this.squash=1,t.sfx("jump",e,i,n,.6),t.audio.play("gemPurple",.6,.6),t.fx.sparkle(e,i+2,n,r,10))},t.col.add(c)}x;y;z;power;cap;squash=0;update(t){this.squash=Math.max(0,this.squash-t*3);const e=Math.sin(this.squash*Math.PI*3)*this.squash*.35;this.cap.scale.set(1+e,1-e,1+e)}}class E1{constructor(t,e,i,n,s,r){this.game=t,this.id=e,this.x=i,this.y=n,this.z=s,this.yaw=r;const o=new kt,h=at(7236216,{rough:.9,flat:!0}),l=new J(new ne(1.3,1.5,.4,8),h);l.position.y=.2,l.receiveShadow=!0,o.add(l);const c=new J(new ne(.35,.55,2.6,5),h);c.position.y=1.7,c.castShadow=!0,o.add(c),this.runeMat=new si({color:6969994}),this.rune=new J(new bi(.28,.05,6,16),this.runeMat),this.rune.position.set(0,2.1,.47),o.add(this.rune),this.orb=new J(new Si(.28,0),te(13214463,.9,!0)),this.orb.position.y=3.4,this.orb.visible=!1,o.add(this.orb),o.position.set(i,n,s),o.rotation.y=r,t.level.root.add(o),t.col.add(hi(i,s,.55,n,n+3)),t.save.checkpoint===e&&t.save.level===t.level.def.id&&this.setActive(!1)}game;id;x;y;z;yaw;range=3.2;label="Commune with the Wardstone";enabled=!0;active=!1;rune;runeMat;orb;setActive(t){if(this.active=!0,this.runeMat.color.setHex(16106603),this.orb.visible=!0,t){const e=this.game;e.sfx("checkpoint",this.x,this.y,this.z),e.fx.ring(this.x,this.y+.2,this.z,.5,5,13214463,.7),e.fx.motes(this.x,this.y+2,this.z,13214463,20),e.toast("Wardstone awakened. Progress saved.","good")}}interact(){this.game.openWardstone(this)}update(t){const e=this.game,i=e.player.body;Math.hypot(i.x-this.x,i.z-this.z)<3.5&&Math.abs(i.y-this.y)<3&&e.player.alive&&(e.save.checkpoint!==this.id||e.save.level!==e.level.def.id)&&(this.setActive(!0),e.activateCheckpoint(this)),this.orb.rotation.y+=t*1.5,this.orb.position.y=3.4+Math.sin(e.time*2)*.12}}class A1{constructor(t,e,i,n,s,r,o=""){if(this.game=t,this.id=e,this.kind=i,this.x=n,this.y=s,this.z=r,this.relicId=o,i==="relic"){const h=new J(new ke(.7,.9,.12),at(14200928,{rough:.4,metal:.6,emissive:9068576,emissiveIntensity:.4}));this.root.add(h);const l=new J(new bi(.2,.04,6,14),te(16773296));l.position.z=.07,this.root.add(l)}else{const h=i==="heart"?16730714:4907130,l=at(h,{rough:.15,metal:.3,emissive:h,emissiveIntensity:.8,flat:!0}),c=new J(new Si(.4,0),l);c.scale.set(.6,1.3,.6),this.root.add(c);const u=new J(new bi(.55,.03,6,20),te(h,.7,!0));u.rotation.x=Math.PI/2,this.root.add(u)}this.root.position.set(n,s+1.2,r),t.level.root.add(this.root)}game;id;kind;x;y;z;relicId;root=new kt;taken=!1;update(t){if(this.taken)return;const e=this.game;this.root.rotation.y+=t*1.8,this.root.position.y=this.y+1.2+Math.sin(e.time*2.5+this.x)*.15,nt.chance(.15)&&e.fx.sparkle(this.x,this.y+1.2,this.z,this.kind==="heart"?16747162:this.kind==="mana"?9105578:16773296,1);const i=e.player.body;Math.hypot(i.x-this.x,i.y+.6-(this.y+1.2),i.z-this.z)<1.5&&(this.taken=!0,e.level.root.remove(this.root),e.collect(this))}}class R1{constructor(t,e,i,n,s,r,o,h,l){this.game=t,this.x=e,this.y=i,this.z=n,this.hx=s,this.hz=r,this.h=o,this.damage=h,this.kind=l;const c=new kt;if(l==="thorns"||l==="spikes"){const u=at(l==="thorns"?4864552:9079448,{rough:.8,metal:l==="spikes"?.6:0}),d=Math.round(s*r*3);for(let f=0;f<d;f++){const m=Ae(.08,.5+nt.next()*.5,u,4);m.position.set((nt.next()-.5)*s*2,0,(nt.next()-.5)*r*2),m.rotation.set(nt.signed()*.5,0,nt.signed()*.5),c.add(m)}if(l==="thorns"){const f=new J(new ke(s*2,.3,r*2),at(2767386,{rough:1}));f.position.y=.1,c.add(f)}}else{const u=l==="lava"?16734736:6955200,d=new J(new Tn(s*2,r*2),te(u,.85));d.rotation.x=-Math.PI/2,d.position.y=.05,c.add(d)}c.position.set(e,i,n),t.level.root.add(c)}game;x;y;z;hx;hz;h;damage;kind;cd=0;contains(t,e,i){return Math.abs(t-this.x)<this.hx&&Math.abs(i-this.z)<this.hz&&e<this.y+this.h&&e>this.y-.5}update(t){this.cd-=t;const e=this.game,i=e.player;(this.kind==="shadow"||this.kind==="lava")&&nt.chance(.3)&&e.fx.emit(this.x+(nt.next()-.5)*this.hx*2,this.y+.1,this.z+(nt.next()-.5)*this.hz*2,{count:1,speed:1,dir:[0,1,0],life:[.6,1.2],size:[.3,.5],color:this.kind==="lava"?16747056:10506495,bright:1.5,gravity:-1}),this.cd<=0&&i.alive&&this.contains(i.x,i.y,i.z)&&(this.cd=.6,i.takeHit({damage:this.damage,type:this.kind==="lava"?"fire":this.kind==="shadow"?"shadow":"physical",dirX:0,dirZ:0,knockback:2,launch:9,stagger:0,hitstop:0,buildup:0,heavy:!1,spike:!1,source:"env",move:"hazard",fromPlayer:!1,ox:this.x,oz:this.z},null))}}class C1{constructor(t,e,i,n,s,r,o=!0,h=6){this.game=t,this.x=e,this.y=i,this.z=n,this.r=s,this.fn=r,this.once=o,this.h=h}game;x;y;z;r;fn;once;h;fired=!1;update(){if(this.fired&&this.once)return;const t=this.game.player.body;Math.hypot(t.x-this.x,t.z-this.z)<this.r&&Math.abs(t.y-this.y)<this.h&&this.game.player.alive?(!this.fired||!this.once)&&(this.fired=!0,this.fn()):this.once||(this.fired=!1)}}class P1{constructor(t,e,i,n,s,r=10506495){this.game=t,this.x=e,this.y=i,this.z=n,this.r=s,this.matR=new si({color:r,transparent:!0,opacity:.2,blending:xi,side:we,depthWrite:!1}),this.mesh=new J(new ne(s,s,7,48,1,!0),this.matR),this.mesh.position.set(e,i+2.5,n),this.mesh.visible=!1,t.level.root.add(this.mesh);const o=Math.max(16,Math.round(s*2.4));for(let h=0;h<o;h++){const l=h/o*Math.PI*2,c=2*Math.PI*s/o,u=On(e+Math.sin(l)*(s+.4),n+Math.cos(l)*(s+.4),c*.6,.4,i-3,i+14,l);u.wallOnly=!0,u.enabled=!1,t.col.add(u),this.walls.push(u)}}game;x;y;z;r;mesh;matR;walls=[];on=!1;set(t){this.on=t;for(const e of this.walls)e.enabled=t;this.mesh.visible=t}update(t){this.on&&(this.matR.opacity=.18+Math.sin(this.game.time*3)*.06,this.mesh.rotation.y+=t*.2)}}class k1{constructor(t,e,i,n,s,r,o,h=40,l=!0){this.game=t,this.id=e,this.x=i,this.y=n,this.z=s,this.r=r,this.waves=o,this.reward=h,this.music=l,this.barrierMat=new si({color:10506495,transparent:!0,opacity:0,blending:xi,side:we,depthWrite:!1}),this.barrier=new J(new ne(r,r,7,48,1,!0),this.barrierMat),this.barrier.position.set(i,n+3.5-1,s),this.barrier.visible=!1,t.level.root.add(this.barrier);const c=Math.max(16,Math.round(r*2.4));for(let u=0;u<c;u++){const d=u/c*Math.PI*2,f=2*Math.PI*r/c,m=On(i+Math.sin(d)*(r+.4),s+Math.cos(d)*(r+.4),f*.6,.4,n-3,n+12,d);m.wallOnly=!0,m.enabled=!1,t.col.add(m),this.walls.push(m)}t.save.found[`arena:${t.level.def.id}:${e}`]&&(this.state="cleared")}game;id;x;y;z;r;waves;reward;music;state="idle";wave=-1;alive=[];waveGap=0;barrier;barrierMat;walls=[];onClear=null;onStart=null;setBarrier(t){for(const e of this.walls)e.enabled=t;this.barrier.visible=t}start(){this.state==="idle"&&(this.state="active",this.wave=-1,this.setBarrier(!0),this.game.sfx("door",this.x,this.y,this.z,1.3),this.game.arenaStarted(this),this.onStart?.(),this.nextWave())}nextWave(){if(this.wave++,this.wave>=this.waves.length){this.finish();return}const t=this.game;for(const e of this.waves[this.wave]){const i=Dd[e.type];if(!i)continue;const n=t.col.groundAt(e.x,e.z,this.y+5,.3).y,s=t.spawnEnemy(e.type,e.x,(n>-1e3?n:this.y)+(i.flying?2:.05),e.z,Math.atan2(this.x-e.x,this.z-e.z),!0);s.spawnDelay=e.delay??0,s.aggro=!0,this.alive.push(s)}this.waves.length>1&&t.toast(`Wave ${this.wave+1} of ${this.waves.length}`,"warn")}finish(){const t=this.game;this.state="cleared",this.setBarrier(!1),t.save.found[`arena:${t.level.def.id}:${this.id}`]=!0,t.sfx("unlock",this.x,this.y,this.z),t.toast("Area cleared!","good"),t.spawnGems(this.x,this.y+1,this.z,{blue:this.reward,red:3,green:2},!0),t.arenaEnded(this),this.onClear?.()}reset(){if(this.state==="active"){for(const t of this.alive)t.alive&&(t.alive=!1,t.dispose());this.alive=[],this.state="idle",this.wave=-1,this.setBarrier(!1)}}update(t){const e=this.game;if(this.state==="idle"){const i=e.player.body;Math.hypot(i.x-this.x,i.z-this.z)<this.r-2&&Math.abs(i.y-this.y)<5&&e.player.alive&&this.start();return}this.state==="active"&&(this.barrierMat.opacity=.18+Math.sin(e.time*3)*.06,this.barrier.rotation.y+=t*.2,this.alive=this.alive.filter(i=>i.alive),this.alive.length===0&&(this.waveGap+=t,this.waveGap>1.2&&(this.waveGap=0,this.nextWave())))}}class L1{constructor(t,e,i,n,s,r,o,h=13214463,l=null){this.game=t,this.x=e,this.y=i,this.z=n,this.target=r,this.label=o,this.action=l;const c=at(7236216,{rough:.9,flat:!0});for(const u of[-1,1]){const d=new J(new ne(.35,.45,4.2,6),c);d.position.set(u*1.9,2.1,0),d.castShadow=!0,this.root.add(d),t.col.add(hi(e+Math.cos(s)*u*1.9,n-Math.sin(s)*u*1.9,.4,i,i+4.2))}this.ring=new J(new bi(1.6,.12,8,32),te(h)),this.ring.position.y=2.2,this.root.add(this.ring),this.disc=new J(new ys(1.5,32),new si({color:h,transparent:!0,opacity:.45,blending:xi,side:we,depthWrite:!1})),this.disc.position.y=2.2,this.root.add(this.disc),this.root.position.set(e,i,n),this.root.rotation.y=s,t.level.root.add(this.root)}game;x;y;z;target;label;action;range=3;enabled=!0;ring;disc;root=new kt;interact(){this.action?this.action():this.game.travel(this.target)}update(t){this.ring.rotation.z+=t,this.disc.material.opacity=.35+Math.sin(this.game.time*3)*.1,nt.chance(.3)&&this.game.fx.sparkle(this.x+nt.signed()*1.2,this.y+1+nt.next()*2.4,this.z+nt.signed()*.3,14731519,1)}}class D1{constructor(t,e,i,n,s,r){this.game=t,this.x=e,this.y=i,this.z=n,this.label=s,this.fn=r,this.game}game;x;y;z;label;fn;range=3.2;enabled=!0;interact(){this.fn()}update(){}}class I1{constructor(t,e,i,n,s,r,o,h){this.game=t,this.x=e,this.y=i,this.z=n,this.h=r,this.permanent=o,this.signal=h,this.radius=s,this.height=r;const l=new Ki({color:10148095,transparent:!0,opacity:.45,roughness:.1,emissive:3836600,emissiveIntensity:.3,depthWrite:!1});this.column=new J(new ne(s*.8,s,r,12,1,!0),l),this.column.position.set(e,i+r/2,n),t.level.root.add(this.column);const c=new Ki({color:13629183,roughness:.1,metalness:.1,emissive:3842256,emissiveIntensity:.25,flatShading:!0,transparent:!0,opacity:.92});this.ice=new J(new ne(s*1.05,s*1.25,r,7,3),c),this.ice.position.copy(this.column.position),this.ice.visible=!1,this.ice.castShadow=!0,t.level.root.add(this.ice);const u=new J(new bi(s*1.1,.25,6,16),at(6974066,{rough:.9,flat:!0}));u.rotation.x=Math.PI/2,u.position.set(e,i+.1,n),t.level.root.add(u),this.solid=hi(e,n,s*1.05,i-.5,i+r),this.solid.enabled=!1,this.solid.surface="ice",t.col.add(this.solid)}game;x;y;z;h;permanent;signal;isEnemy=!1;alive=!0;radius;height;frozen=!1;solid;column;ice;fxT=0;chill=0;frozenT=0;takeHit(t){return t.type!=="ice"?(!this.frozen&&t.type!=="physical"&&this.game.toast("The geyser needs to be frozen.","hint"),"none"):this.frozen?(this.frozenT=0,"hit"):(this.chill+=t.buildup+t.damage,this.chill>=60&&this.freeze(),"hit")}freeze(){this.frozen=!0,this.frozenT=0,this.solid.enabled=!0,this.column.visible=!1,this.ice.visible=!0;const t=this.game;t.sfx("iceCrack",this.x,this.y,this.z),t.fx.shatter(this.x,this.y+this.h,this.z),this.signal&&t.level.emit(this.signal)}thaw(){this.frozen=!1,this.chill=0,this.solid.enabled=!1,this.column.visible=!0,this.ice.visible=!1,this.game.fx.splash(this.x,this.y+this.h,this.z)}update(t){const e=this.game;if(this.frozen){this.frozenT+=t,!this.permanent&&this.frozenT>14&&this.thaw();return}this.chill=Math.max(0,this.chill-t*10),this.fxT-=t,this.fxT<=0&&(this.fxT=.05,e.fx.emit(this.x,this.y+this.h,this.z,{count:3,speed:4,dir:[0,1,0],spread:.6,life:[.5,.9],size:[.2,.35],sizeEnd:1.5,color:14743295,alpha:.7,additive:!1,gravity:10,jitter:this.radius*.5})),this.column.material.opacity=.38+Math.sin(e.time*12)*.06;const n=e.player.body;Math.hypot(n.x-this.x,n.z-this.z)<this.radius&&n.y>=this.y-.5&&n.y<this.y+this.h+1&&(n.vy=Math.max(n.vy,14),n.grounded=!1)}}class N1{def;root=new kt;col=new Sx;shaper=null;props=[];hittables=[];interactables=[];updrafts=[];hazards=[];arenas=[];wardstones=new Map;npcs=[];waterLevel=-1e4;killY;water=null;listeners=new Map;slamListeners=[];torchGroups=new Map;fired=new Set;constructor(t){this.def=t,this.killY=t.killY}on(t,e){let i=this.listeners.get(t);i||(i=[],this.listeners.set(t,i)),i.push(e)}emit(t){this.fired.add(t);for(const e of this.listeners.get(t)??[])e()}onSlam(t){this.slamListeners.push(t)}slam(t,e,i,n){for(const s of this.slamListeners)s(t,e,i,n)}torchGroup(t,e){const i=this.torchGroups.get(t)??{total:0,lit:0,signal:e,done:!1};i.signal=e,this.torchGroups.set(t,i)}addTorch(t,e){const i=this.torchGroups.get(t)??{total:0,lit:0,signal:"",done:!1};i.total++,e&&i.lit++,this.torchGroups.set(t,i)}torchLit(t){const e=this.torchGroups.get(t);!e||e.done||(e.lit++,e.lit>=e.total&&(e.done=!0,e.signal&&this.emit(e.signal)))}torchOut(t){const e=this.torchGroups.get(t);e&&!e.done&&(e.lit=Math.max(0,e.lit-1))}groupDone(t){return this.torchGroups.get(t)?.done??!1}update(t){for(const e of this.props)e.update(t);for(const e of this.npcs)e.update(t)}dispose(t){t.remove(this.root),this.root.traverse(e=>{const i=e;i.isMesh&&i.geometry&&!i.isInstancedMesh&&i.geometry.getAttribute("position")?.count>5e3&&i.geometry.dispose()})}}class Ud{constructor(t,e,i,n,s,r,o){this.game=t,this.id=e,this.x=n,this.y=s,this.z=r,this.rig=new Ph(i),this.yaw=o,this.rig.root.position.set(n,s,r),this.rig.root.rotation.y=o,t.level.root.add(this.rig.root)}game;id;x;y;z;rig;pose=Ch();talking=!1;yaw;update(t){const e=this.game.player.body;if(Math.hypot(e.x-this.x,e.z-this.z)<9){let s=Math.atan2(e.x-this.x,e.z-this.z)-this.yaw;for(;s>Math.PI;)s-=Math.PI*2;for(;s<-Math.PI;)s+=Math.PI*2;this.yaw+=s*Math.min(1,t*2)}this.rig.root.rotation.y=this.yaw,this.pose.talk=this.game.dialogueSpeaker===this.id,this.rig.update(t,this.pose)}}class U1{decor;level;game;constructor(t,e){this.game=t,this.level=e,this.decor=new m1(e.def.id.length*97+13)}get col(){return this.level.col}y(t,e){const i=this.col.groundAt(t,e,1e4,.05).y;return i>-1e3?i:0}terrain(t){const e=new c1;t.shape(e),this.level.shaper=e;const i=Ah.fromFunction(t.x0,t.z0,t.sizeX,t.sizeZ,t.cell,(s,r)=>e.height(s,r));this.col.terrain=i;const n=d1(i,(s,r,o,h)=>t.color(s,r,o,h,e.pathMask(s,r)));if(this.level.root.add(n),t.skirt){const s=u1(i,t.skirt.depth,t.skirt.color);s&&this.level.root.add(s)}}water(t){this.level.waterLevel=t.level;const e=new Nd(t.level,420,t.deep,t.shallow,t.glint,t.opacity??.82);this.level.water=e,this.level.root.add(e.mesh)}box(t,e,i,n,s,r,o,h={}){const l=On(t,i,n/2,r/2,e,e+s,h.yaw??0);if(l.surface=h.surface??"stone",this.col.add(l),!h.noMesh){const c=new J(new ke(n,s,r),at(o,{rough:.9,flat:h.flat??!0}));if(c.position.set(t,e+s/2,i),c.rotation.y=h.yaw??0,c.castShadow=h.cast??!0,c.receiveShadow=!0,this.level.root.add(c),h.trim!==void 0){const u=new J(new ke(n+.12,.14,r+.12),at(h.trim,{rough:.6}));u.position.set(t,e+s-.07,i),u.rotation.y=h.yaw??0,this.level.root.add(u)}}return l}platform(t,e,i,n,s,r=10129274,o=1,h={}){return this.box(t,e-o,i,n,o,s,r,{trim:h.trim??12103064,...h})}pillar(t,e,i,n,s,r=11050634){const o=hi(t,e,i,n,s);this.col.add(o);const h=new J(new ne(i,i*1.08,s-n,8),at(r,{rough:.9,flat:!0}));h.position.set(t,(n+s)/2,e),h.castShadow=h.receiveShadow=!0,this.level.root.add(h);const l=new J(new ne(i*1.12,i*1.12,.25,8),at(13155750,{rough:.8,flat:!0}));return l.position.set(t,s-.12,e),l.receiveShadow=!0,this.level.root.add(l),o}islet(t,e,i,n,s=5937738,r=8023646){const o=hi(t,i,n,e-1.5,e);o.surface="grass",this.col.add(o);const h=new J(new ne(n,n*.95,.6,14),at(s,{rough:1,flat:!0}));h.position.set(t,e-.3,i),h.receiveShadow=!0,this.level.root.add(h);const l=new J(new cn(n*.95,n*1.8,10,2),at(r,{rough:1,flat:!0}));return l.rotation.x=Math.PI,l.position.set(t,e-.6-n*.9,i),l.castShadow=!0,this.level.root.add(l),o}ramp(t,e,i,n,s,r,o,h=10129274,l=.6){const c=ic(t,e,i/2,n/2,Math.min(r,o)-l,r,o,s);this.col.add(c);const u=o-r,d=Math.hypot(n,u),f=new J(new ke(i,l,d),at(h,{rough:.9,flat:!0}));return f.position.set(t,(r+o)/2-l/2,e),f.rotation.order="YXZ",f.rotation.y=s,f.rotation.x=-Math.atan2(u,n),f.castShadow=f.receiveShadow=!0,this.level.root.add(f),c}stairs(t,e,i,n,s,r,o,h=11050634){const l=(r-s)/o,c=.7;for(let u=0;u<o;u++){const d=t+Math.sin(n)*c*(u+.5),f=e+Math.cos(n)*c*(u+.5);this.box(d,s-.5,f,i,l*(u+1)+.5,c,h,{yaw:n})}}bridge(t,e,i,n,s,r,o=3){const h=Math.hypot(n-t,s-e),l=Math.atan2(n-t,s-e),c=(t+n)/2,u=(e+s)/2,d=ic(c,u,o/2,h/2,Math.min(i,r)-.4,i,r,l);d.surface="wood",this.col.add(d);const f=at(9071172,{rough:.95}),m=at(5914664,{rough:.95}),v=Math.max(2,Math.round(h/.6));for(let p=0;p<v;p++){const g=(p+.5)/v,y=new J(new ke(o,.15,.5),p%3===0?m:f);y.position.set(t+(n-t)*g,i+(r-i)*g-.08,e+(s-e)*g),y.rotation.y=l,y.rotation.z=(nt.next()-.5)*.04,y.castShadow=y.receiveShadow=!0,this.level.root.add(y)}for(const p of[-1,1]){const g=Math.cos(l)*p*(o/2),y=-Math.sin(l)*p*(o/2);for(let x=0;x<=Math.ceil(h/3);x++){const S=x/Math.ceil(h/3),T=new J(new ne(.07,.08,1.1,5),m);T.position.set(t+(n-t)*S+g,i+(r-i)*S+.45,e+(s-e)*S+y),this.level.root.add(T)}const b=new J(new ne(.03,.03,Math.hypot(h,r-i),4),at(13152384));b.position.set(c+g,(i+r)/2+.95,u+y),b.rotation.order="YXZ",b.rotation.y=l,b.rotation.x=Math.PI/2-Math.atan2(r-i,h),this.level.root.add(b)}}wall(t,e,i,n,s,r,o=1,h=9077362){const l=Math.hypot(i-t,n-e);return this.box((t+i)/2,s,(e+n)/2,o,r,l,h,{yaw:Math.atan2(i-t,n-e)})}bound(t,e,i,n){const s=Math.hypot(i-t,n-e),r=On((t+i)/2,(e+n)/2,.5,s/2,-200,300,Math.atan2(i-t,n-e));r.wallOnly=!0,this.col.add(r)}boundCircle(t,e,i,n=32){for(let s=0;s<n;s++){const r=s/n*Math.PI*2,o=(s+1)/n*Math.PI*2;this.bound(t+Math.sin(r)*i,e+Math.cos(r)*i,t+Math.sin(o)*i,e+Math.cos(o)*i)}}arch(t,e,i,n,s,r=12103064){const o=this.y(t,e);for(const l of[-1,1]){const c=t+Math.cos(i)*l*n*.5,u=e-Math.sin(i)*l*n*.5;this.pillar(c,u,.55,o-.5,o+s,r)}const h=new J(new ke(n+1.6,.8,1.2),at(r,{rough:.9,flat:!0}));h.position.set(t,o+s+.4,e),h.rotation.y=i,h.castShadow=!0,this.level.root.add(h)}tree(t,e,i,n,s,r=!0){const o=this.y(t,e);this.decor.tree(t,o,e,i,n,s),r&&n!=="crystal"&&this.col.add(hi(t,e,.35*i,o-1,o+3*i))}rock(t,e,i,n=8221798,s=i>.9){const r=this.y(t,e);this.decor.rock(t,r-i*.15,e,i,n),s&&this.col.add(hi(t,e,i*.8,r-1,r+i*.7))}mushroom(t,e,i,n,s=!1){const r=this.y(t,e);this.decor.mushroom(t,r,e,i,n,s),i>1.2&&this.col.add(hi(t,e,.2*i,r-1,r+1.2*i))}scatter(t,e,i,n,s,r){let o=0;for(let h=0;h<t*6&&o<t;h++){const l=this.decor.rng.next()*Math.PI*2,c=Math.sqrt(this.decor.rng.next())*n,u=e+Math.sin(l)*c,d=i+Math.cos(l)*c,f=this.col.terrainAt(u,d);f<-1e3||f<this.level.waterLevel+.15||this.level.shaper&&this.level.shaper.pathMask(u,d)>.3||r&&!r(u,d,f)||(s(u,d,f),o++)}}addProp(t){return this.level.props.push(t),t}enemy(t,e,i,n=0,s){const r=s??this.y(e,i);this.game.pendingSpawns.push({type:t,x:e,y:r+.05,z:i,yaw:n})}arena(t,e,i,n,s,r=40){const o=this.addProp(new k1(this.game,t,e,this.y(e,i),i,n,s,r));return this.level.arenas.push(o),o}gems(t,e,i,n,s=1.5,r){const o=r??this.y(t,e);if(n===1){this.game.placeGem(i,1,t,o+.5,e);return}for(let h=0;h<n;h++){const l=h/n*Math.PI*2;this.game.placeGem(i,1,t+Math.sin(l)*s,o+.5,e+Math.cos(l)*s)}}gemLine(t,e="blue",i=1.6){for(let n=0;n<t.length-1;n++){const[s,r]=t[n],[o,h]=t[n+1],l=Math.hypot(o-s,h-r),c=Math.max(1,Math.floor(l/i));for(let u=0;u<c;u++){const d=u/c,f=s+(o-s)*d,m=r+(h-r)*d;this.game.placeGem(e,1,f,this.y(f,m)+.5,m)}}}crystal(t,e,i,n,s=!1,r){const o=this.addProp(new g1(this.game,t,r??this.y(t,e),e,i,n,s));this.level.hittables.push(o)}checkpoint(t,e,i,n=0){const s=this.addProp(new E1(this.game,t,e,this.y(e,i),i,n));return this.level.wardstones.set(t,s),this.level.interactables.push(s),s}collectible(t,e,i,n,s,r=""){const o=`${this.level.def.id}:${t}`;this.game.save.found[o]||this.addProp(new A1(this.game,o,e,i,s??this.y(i,n),n,r))}torch(t,e,i,n=!1,s=0,r){const o=this.addProp(new v1(this.game,t,r??this.y(t,e),e,i,n,s));return this.level.hittables.push(o),this.level.addTorch(i,n),o}torchGroup(t,e){this.level.torchGroup(t,e)}gate(t,e,i,n,s,r,o="",h){const l=this.addProp(new y1(this.game,t,h??this.y(t,e),e,i,n,s,r,o));return this.level.hittables.push(l),l}switchCrystal(t,e,i,n,s){const r=this.addProp(new _1(this.game,t,s??this.y(t,e),e,i,n));return this.level.hittables.push(r),r}plate(t,e,i,n){return this.addProp(new M1(this.game,t,n??this.y(t,e),e,i))}mover(t,e,i,n,s=10129274,r=0,o="",h=.6){return this.addProp(new w1(this.game,t.map(([l,c,u])=>new C(l,c,u)),e,i,n,s,r,o,h))}geyser(t,e,i,n,s=!1,r="",o){const h=this.addProp(new I1(this.game,t,o??this.y(t,e),e,i,n,s,r));return this.level.hittables.push(h),h}crumble(t,e,i,n,s){return this.addProp(new b1(this.game,t,e,i,n,s))}updraft(t,e,i,n,s,r=34){const o=this.addProp(new S1(this.game,t,n,e,i,s,r));return this.level.updrafts.push(o),o}shroom(t,e,i=18,n=16734874,s){return this.addProp(new T1(this.game,t,s??this.y(t,e),e,i,n))}hazard(t,e,i,n,s,r,o=1,h){const l=this.addProp(new R1(this.game,t,h??this.y(t,e),e,i,n,o,s,r));return this.level.hazards.push(l),l}trigger(t,e,i,n,s=!0,r){return this.addProp(new C1(this.game,t,r??this.y(t,e),e,i,n,s))}story(t,e,i,n,s){const r=`story:${this.level.def.id}:${t}`;this.game.save.found[r]||this.trigger(e,i,n,()=>{this.game.save.found[r]=!0,s()})}portal(t,e,i,n,s,r=13214463,o=null){const h=this.addProp(new L1(this.game,t,this.y(t,e),e,i,n,s,r,o));return this.level.interactables.push(h),h}npc(t,e,i,n,s,r,o){const h=new Ud(this.game,t,e,i,this.y(i,n),n,s);this.level.npcs.push(h),this.col.add(hi(i,n,.9*e.scale,this.y(i,n),this.y(i,n)+1.5*e.scale));const l=new D1(this.game,i,this.y(i,n),n,r,o);return this.level.interactables.push(l),h}beacon(t,e,i,n,s=1){const r=new J(new Si(.5*s,0),te(n));r.position.set(t,e,i),this.level.root.add(r)}finish(){this.decor.build(this.level.root)}}class F1{constructor(t,e,i=20){this.game=t,this.kind=e,this.rate=i}game;kind;rate;t=0;update(t){this.t+=t*this.rate;const e=this.game,i=e.player;for(;this.t>=1;){this.t-=1;const n=nt.next()*Math.PI*2,s=4+nt.next()*22,r=i.x+Math.sin(n)*s,o=i.z+Math.cos(n)*s,h=e.col.terrainAt(r,o),l=Math.max(h>-1e3?h:i.y,e.waterLevel>-1e3?e.waterLevel:-1e9);switch(this.kind){case"firefly":e.fx.emit(r,l+.5+nt.next()*3,o,{count:1,speed:.4,life:[2,4],size:[.1,.16],sizeEnd:.5,color:nt.chance(.5)?15794048:10551184,bright:2.2,drag:.3,gravity:-.05});break;case"snow":e.fx.emit(r,i.y+8+nt.next()*4,o,{count:1,speed:.6,dir:[.3,-1,.1],spread:.4,life:[4,6],size:[.08,.14],sizeEnd:1,color:16777215,alpha:.9,additive:!1,drag:.2});break;case"ember":e.fx.emit(r,l+nt.next()*2,o,{count:1,speed:.8,dir:[0,1,0],spread:.5,life:[2,3.5],size:[.06,.12],sizeEnd:.2,color:16748608,bright:2,gravity:-.3});break;case"pollen":e.fx.emit(r,l+.5+nt.next()*4,o,{count:1,speed:.4,dir:[1,.1,.3],spread:.5,life:[3,5],size:[.06,.1],sizeEnd:1,color:16773296,bright:1.2,drag:.2});break;case"shadow":e.fx.emit(r,l+nt.next()*2,o,{count:1,speed:.5,dir:[0,1,0],spread:.4,life:[2,4],size:[.15,.3],sizeEnd:.1,color:11554047,bright:1.4,gravity:-.2});break}}}}function Fd(a,t,e=20){a.level.props.push(new F1(a.game,t,e))}function Is(a,t,e){const i=new Nt(a),n=new Nt(t);return i.lerp(n,Math.max(0,Math.min(1,e))).getHex()}function zd(a){return(t,e,i,n,s)=>{const r=a.water??0;let o;if(i<r-.3)o=a.under;else if(i<r+.5)o=Is(a.under,a.shore,(i-(r-.3))/.8);else{const h=Math.sin(t*.31+e*.17)*.5+Math.sin(t*.07-e*.13)*.5;o=Is(a.grass,a.grass2,h*.5+.5),a.high!==void 0&&a.highAt!==void 0&&(o=Is(o,a.high,(i-a.highAt)/4))}return n>.6&&(o=Is(o,a.rock,(n-.6)*2.5)),s>0&&(o=Is(o,a.path,s*.85)),o}}function Oi(a,t=1){const e=Math.sin(a*127.1+t*311.7)*43758.5453;return(e-Math.floor(e))*2-1}function z1(a,t){const e=a.game,i=a.level.def.id;if(e.save.levelsDone[i])return;const n=new P1(e,t.x,a.y(t.x,t.z),t.z,t.r);a.level.props.push(n);const s=()=>{if(e.boss&&e.boss.alive)return;const r=t.spawn(e);e.addBoss(r),n.set(!0);const o=()=>{r.awake=!0,e.audio.setMusic(zs.boss)};r.onDefeated=()=>{n.set(!1),e.audio.setMusic(null),setTimeout(()=>{e.level?.def.id===i&&t.onDefeated(e)},2e3)};const h=`story:${i}:${t.id}`;e.save.found[h]?o():(e.save.found[h]=!0,e.say(t.intro,o))};a.trigger(t.triggerX,t.triggerZ,t.triggerR,()=>{(!e.boss||!e.boss.alive)&&s()},!1),a.level.on("boss-reset",()=>n.set(!1))}class B1 extends Ld{speakerId="";phase=1;phases=3;spawnX;spawnY;spawnZ;onDefeated=null;awake=!1;constructor(t,e,i,n,s,r=0){super(t,e,i,n,s,r),this.isBoss=!0,this.scripted=!0,this.state="idle",this.spawnX=i,this.spawnY=n,this.spawnZ=s}get hpFrac(){return this.hp/this.maxHp}updateBoss(t){}resetBoss(){this.alive&&(this.hp=this.maxHp,this.phase=1,this.status.clear(),this.body.setPos(this.spawnX,this.spawnY,this.spawnZ),this.body.vx=this.body.vy=this.body.vz=0,this.setState("idle"),this.awake=!1,this.onReset())}onReset(){}die(t,e=null){this.alive&&(super.die(t,e),this.game.shake(.8,.8),this.game.slowmo(.25,1.5),this.game.sfx("bossRoar",this.x,this.y,this.z,.7),this.game.fx.shadowPoof(this.x,this.y+this.height*.5,this.z,3),this.onDefeated?.())}get removable(){return this.state==="dead"&&this.deadT>2.5}}const Mc=(a,t,e)=>new C(a,t,e);class O1{root=new kt;body=new kt;jaw=new kt;tongue;arms=[];eyes=[];mats=[];t=0;p={crouch:0,jaw:0,tongue:0,armL:0,armR:0,lean:0,sink:0};constructor(){const t=yi(5925426,{rough:.8}),e=yi(11049562,{rough:.85});this.mats.push(t,e);const i=at(2763288,{rough:1});this.root.add(this.body);const n=Dt(2.3,1.7,2.1,t,20);n.position.y=2,this.body.add(n);const s=Dt(1.9,1.3,1.4,e,16);s.position.set(0,1.6,.9),this.body.add(s);const r=Dt(1.9,.18,1.2,i,14);r.position.set(0,2.1,1.25),this.body.add(r),this.jaw.position.set(0,2.05,.6),this.body.add(this.jaw);const o=Dt(1.8,.45,1.3,e,14);o.position.set(0,-.3,.7),this.jaw.add(o);const h=new ne(.28,.35,1,10);h.rotateX(Math.PI/2),h.translate(0,0,.5),this.tongue=new J(h,yi(14176362,{rough:.4})),this.tongue.position.set(0,0,.9),this.tongue.scale.z=.01,this.jaw.add(this.tongue);for(let u=-3;u<=3;u++){const d=Ae(.09,.3,at(15788240),4);d.position.set(u*.28,2,1.7-Math.abs(u)*.12),d.rotation.x=Math.PI,this.body.add(d)}for(const u of[-1,1]){const d=Dt(.55,.5,.55,t,12);d.position.set(u*.95,3.45,.7),this.body.add(d);const f=Dt(.34,.34,.2,te(16764992),10);f.position.set(u*.98,3.55,1.12),this.body.add(f),this.eyes.push(f);const m=Dt(.08,.26,.05,at(1050632),6);m.position.set(u*.98,3.55,1.3),this.body.add(m)}const l=te(12603647);for(let u=0;u<8;u++){const d=Dt(.08,.5,.05,l,6),f=-1.2+u*.35;d.position.set(Math.sin(f)*2.2,2.2+Math.cos(u*1.7)*.5,Math.cos(f)*1.9-.3),d.rotation.set(0,f,u*.7),this.body.add(d)}const c=at(3824162,{rough:1,flat:!0});for(let u=0;u<9;u++){const d=new J(new oi(.4+nt.next()*.3,0),c),f=nt.next()*Math.PI*2;d.position.set(Math.sin(f)*1.6,3.2+nt.next()*.3,Math.cos(f)*1.3-.5),this.body.add(d)}for(let u=0;u<5;u++){const d=Ae(.25,.9,at(4864552),5);d.position.set((u-2)*.6,3.4,-.6-Math.abs(u-2)*.2),d.rotation.x=-.6,this.body.add(d)}for(const u of[1,-1]){const d=new kt;d.position.set(u*2.1,2.3,.6),d.add(We(Mc(0,0,0),Mc(u*.4,-1.1,.4),.45,.4,t,10));const f=Dt(.55,.4,.6,t,10);f.position.set(u*.45,-1.3,.55),d.add(f);for(let p=-1;p<=1;p++){const g=Ae(.1,.4,at(15788240),4);g.position.set(u*.45+p*.25,-1.5,1),g.rotation.x=Math.PI*.6,d.add(g)}this.body.add(d),this.arms.push(d);const m=Dt(.9,.7,1.1,t,12);m.position.set(u*1.7,.7,-.8),this.body.add(m);const v=Dt(.7,.3,1,t,10);v.position.set(u*1.8,.2,-.1),this.body.add(v)}this.root.traverse(u=>{u.isMesh&&(u.castShadow=!0)})}setFlash(t,e){for(const i of this.mats)i.emissive.setHex(e),i.emissiveIntensity=t}update(t,e){this.t+=t;const i=this.p;let n=0,s=.05+Math.sin(this.t*1.5)*.03,r=0,o=Math.sin(this.t*1.2)*.1,h=-o,l=0,c=0;const u=e.attack,d=e.state==="windup"?le(0,1,e.windup):0,f=e.state==="active";if(e.state==="windup"||f||e.state==="recover")switch(u){case"tongue":s=e.state==="windup"?.2+d*.3:f?.6:.3,r=f?Math.min(1,e.t/.12):0,l=-.15*d+(f?.15:0);break;case"swing":o=e.state==="windup"?-1.8*d:f?.9:.4,l=f?.2:0;break;case"slam":n=e.state==="windup"?d:0,s=.3,o=h=-.8;break;case"spit":s=e.state==="windup"?d*.5:.7,l=e.state==="windup"?-.3*d:.25;break;case"roar":s=.8,l=-.3,o=h=-1.2;break}e.state==="hitstun"&&(l=.35,s=.4,o=h=.5,c=e.flipped?.8:.2),e.dead&&(l=.6,s=.6,c=1.2),i.crouch=Ft(i.crouch,n,10,t),i.jaw=Ft(i.jaw,s,18,t),i.tongue=Ft(i.tongue,r,30,t),i.armL=Ft(i.armL,o,14,t),i.armR=Ft(i.armR,h,14,t),i.lean=Ft(i.lean,l,10,t),i.sink=Ft(i.sink,c,4,t);const m=1+Math.sin(this.t*2)*.02,v=e.speed>.1?Math.abs(Math.sin(this.t*6))*.25*Math.min(1,e.speed):0;this.body.scale.set(m*(1+i.crouch*.12),(1-i.crouch*.25)/m,m),this.body.position.y=v-i.sink,this.body.rotation.x=i.lean,this.jaw.rotation.x=i.jaw,this.tongue.scale.z=Math.max(.01,i.tongue*9),this.arms[0].rotation.x=i.armR,this.arms[1].rotation.x=i.armL;for(const p of this.eyes)p.scale.y=e.state==="hitstun"?.3:1}}const H1={id:"bogmaw",name:"Bogmaw",hp:720,radius:2.3,height:4.2,speed:3.4,turnRate:2.2,mass:0,poise:180,resist:{fire:1.4},statusResist:{ice:.5,lightning:.5,fire:.8},aggroRange:60,gems:{blue:150,red:6,green:4,purple:6},attacks:[{id:"swipe",pose:"swing",range:4.8,windup:.75,active:.25,recover:.8,cooldown:1.6,weight:3,kind:"melee",damage:16,knockback:12,hitRange:2.6,hitArc:1.4},{id:"tongue",pose:"tongue",range:11,minRange:3,windup:.7,active:.35,recover:.9,cooldown:3,weight:2,kind:"melee",damage:14,knockback:14,hitRange:9,hitArc:.22},{id:"spit",pose:"spit",range:22,minRange:7,windup:.8,active:.1,recover:.8,cooldown:4,weight:2,kind:"projectile",damage:12,knockback:6},{id:"belly",pose:"slam",range:16,minRange:2,windup:.9,active:2,recover:1.1,cooldown:6,weight:2,kind:"melee",damage:22,knockback:12,telegraph:!1},{id:"summon",pose:"roar",range:60,windup:.9,active:.2,recover:.8,cooldown:14,weight:1,kind:"projectile",damage:0,knockback:0}],build:()=>new O1,styleValue:10};class G1 extends B1{displayName="Bogmaw, the Mire King";jumping=!1;stuck=0;minions=0;constructor(t,e,i,n,s){super(t,H1,e,i,n,s),this.speakerId="bogmaw",this.phases=3}think(t){const e=this.game,i=this.body;if(!this.awake){this.yaw=Xi(this.yaw,this.yawToPlayer(),t*2);return}const n=this.hpFrac,s=n<.33?3:n<.66?2:1;if(s>this.phase&&(this.phase=s,e.sfx("bossRoar",i.x,i.y,i.z),e.shake(.5,.6),e.toast(s===2?"Bogmaw calls the Gloom!":"Bogmaw is enraged!","warn"),this.globalCd=.3,this.cooldowns.set("summon",0)),this.stuck>0){this.stuck-=t,i.vx*=.8,i.vz*=.8,Math.random()<.2&&e.fx.dust(i.x,i.y,i.z,2,5917232);return}const r=this.distToPlayer();if(this.state==="windup"||this.state==="active"||this.state==="recover"){if(this.attack?.id==="belly"&&this.state==="active"){this.bellyUpdate();return}this.runAttack(t*(this.phase===3?1.25:1),r,this.yawToPlayer());return}const o=this.globalCd<=0?this.pickAttack(r):null;if(o&&!(o.id==="summon"&&(this.phase<2||this.minions>=3))){this.startAttack(o);return}this.globalCd=Math.max(0,this.globalCd-t*(this.phase===3?.5:0));const h=this.yawToPlayer();r>4?this.moveDir(h,this.def.speed*(this.phase===3?1.3:1),t):this.yaw=Xi(this.yaw,h,this.def.turnRate*t),this.state=r>4?"chase":"strafe"}onActiveStart(t){const e=this.game,i=this.body,n=e.player.body;if(t.id==="belly"){const s=n.x-i.x,r=n.z-i.z,o=1.1;i.vx=s/o,i.vz=r/o,i.vy=15,i.grounded=!1,this.jumping=!0,this.yaw=Ee(s,r),e.sfx("flap",i.x,i.y,i.z,.4),e.fx.ring(n.x,n.y,n.z,.3,4,16724016,1.1);return}if(t.id==="spit"){const s=this.phase>=2?3:1;for(let r=0;r<s;r++){const o=r===0?0:(r===1?1:-1)*3.5,h=n.x+n.vx*.5+Math.cos(this.yaw)*o,l=n.z+n.vz*.5-Math.sin(this.yaw)*o,c=i.x+Math.sin(this.yaw)*2,u=i.z+Math.cos(this.yaw)*2,d=i.y+2.4,f=Math.hypot(h-c,l-u),m=.6,v=16,p=Math.sqrt(f*v/Math.sin(2*m)),g=Ee(h-c,l-u);e.spawnProjectile({x:c,y:d,z:u,dx:Math.sin(g)*Math.cos(m),dy:Math.sin(m),dz:Math.cos(g)*Math.cos(m),speed:p,radius:.6,damage:12,type:"physical",color:6969898,life:4,gravity:v,fromPlayer:!1,kind:"boulder",explode:2.4,knockback:6})}e.sfx("swingHeavy",i.x,i.y,i.z,.5);return}if(t.id==="summon"){const s=this.phase===3?3:2;for(let r=0;r<s;r++){const o=this.yaw+(r-(s-1)/2)*.9,h=i.x+Math.sin(o)*5,l=i.z+Math.cos(o)*5,c=e.col.groundAt(h,l,i.y+4,.3).y,u=e.spawnEnemy(r===2?"slinger":"grunt",h,c+.05,l,o,!0);u.aggro=!0,this.minions++,u.onDeath=()=>this.minions--}e.sfx("bossRoar",i.x,i.y,i.z,1.2,.7),e.shake(.4,.5)}}bellyUpdate(){const t=this.game,e=this.body;if(this.jumping&&e.grounded&&this.stateT>.2){this.jumping=!1,t.spawnShockwave(e.x,e.y,e.z,this.phase>=2?16:12,11,14*t.difficultyInfo.enemyDamage,9,this),t.shake(.9,.5),t.sfx("pound",e.x,e.y,e.z,.6),t.fx.dust(e.x,e.y,e.z,30,6969914),t.fx.splash(e.x,e.y,e.z,9079386);const i=t.player,n=Math.hypot(i.x-e.x,i.z-e.z);if(n<this.def.radius+1.2){const s=n||1;i.takeHit(ze({damage:22*t.difficultyInfo.enemyDamage,dirX:(i.x-e.x)/s,dirZ:(i.z-e.z)/s,knockback:14,launch:7,source:"enemy",fromPlayer:!1,ox:e.x,oz:e.z}),this)}e.vx=e.vz=0,this.state="recover",this.stateT=0,this.phase===3&&(this.stuck=2.6,t.toast("Bogmaw is stuck in the mud! Strike now!","good"))}else this.stateT>2.2&&(this.state="recover",this.stateT=0,this.jumping=!1)}onBossStagger(t){this.attack=null,this.jumping=!1,this.setState("hitstun"),this.hitstunMax=2.4,this.game.toast("Bogmaw is staggered!","good"),this.game.sfx("bossRoar",this.x,this.y,this.z,1.4,.6)}takeHit(t){const e=super.takeHit(t);return this.stuck>0&&e==="hit"&&(this.hp-=t.damage*.5),e}onReset(){this.stuck=0,this.jumping=!1}}const V1={aster:{name:"Aster",color:"#c9a2ff"},flick:{name:"Flick",color:"#ffe070"},glimmer:{name:"Mother Glimmer",color:"#fff0a0"},emberhold:{name:"Emberhold",color:"#ff8a50"},stormcrest:{name:"Stormcrest",color:"#7ac8ff"},frostfang:{name:"Frostfang",color:"#bff4ff"},stonehide:{name:"Stonehide",color:"#9be06a"},nyxa:{name:"Nyxa",color:"#e060ff"},hollow:{name:"The Hollow King",color:"#b04cff"},gloom:{name:"Gloomling",color:"#c090ff"},bogmaw:{name:"Bogmaw",color:"#9ab060"},skrieka:{name:"Skrieka",color:"#7ac8ff"},grolm:{name:"Forgemaster Grolm",color:"#bfe8ff"},graveljaw:{name:"Graveljaw",color:"#c8a878"}},wc=["In the age of the Twin Moons, the dragons of Veyra kept their eggs in the Warden Sanctum, guarded by the four masters of breath.","Then came the night the moons swallowed the sun. The Hollow King's shadow host poured out of the dark, and the Sanctum burned.","The eggs were lost. All but one.","Old Emberhold set a single violet egg adrift on the river, and prayed it would find a gentler home.","It came to rest among the fireflies of Marshlight Fen.","Twelve summers later..."],th={body:13124906,belly:15905626,horn:15259824,membrane:15765546,eye:16764992,spikes:15259824,scale:1.9,hornStyle:"curled",tailStyle:"fan",slender:.3,beard:!0},bc={body:15255624,belly:6982360,horn:3820170,membrane:5933800,eye:8046847,spikes:3820170,scale:1.6,hornStyle:"crown",tailStyle:"arrow",slender:.65},Sc={body:10143976,belly:15267071,horn:16777215,membrane:12577023,eye:6344959,spikes:16777215,scale:1.8,hornStyle:"blade",tailStyle:"fan",slender:.85},Tc={body:5933626,belly:13152368,horn:9075290,membrane:10137696,eye:16756784,spikes:9075290,scale:2.3,hornStyle:"curled",tailStyle:"club",slender:0,beard:!0},W1={body:1971752,belly:9054826,horn:13684960,membrane:9050714,eye:16724096,spikes:13684960,scale:1.35,hornStyle:"blade",tailStyle:"scythe",slender:.95,glowEyes:!0},no={fen:{name:"Marshlight Fen",blurb:"The firefly marsh where Aster grew up.",collectibles:7},sanctum:{name:"Warden Sanctum",blurb:"The ruined temple of the Wardens.",collectibles:4},falls:{name:"Stormspire Falls",blurb:"Cliffs, waterfalls and a spire struck by endless lightning.",collectibles:7},frostworks:{name:"The Frostworks",blurb:"An ice forge hammering out chains for the Hollow King.",collectibles:7},plains:{name:"Stonewild Plains",blurb:"Tall grass over stone older than dragons.",collectibles:7},keep:{name:"Eclipse Keep",blurb:"Nyxa's fortress beneath the darkened moons.",collectibles:5}},Bd={fen1:{level:"fen",title:"The Drifting Egg",text:"Here the river slows and the fireflies gather. A reed raft washed ashore on the night of the Eclipse, bearing a single egg that glowed like dusk."},fen2:{level:"fen",title:"Firefly Custom",text:"Fireflies name their young for the first light they see. The hatchling from the raft saw only the violet of his own shell, so they called him Aster, after the marsh flower of that color."},fen3:{level:"fen",title:"Marsh Warning",text:"Carved on the old stone: when the twin moons darken, the Gloom crawls up from the roots of the world. Keep the lanterns lit."},sanc1:{level:"sanctum",title:"The Four Wardens",text:"Fire to kindle, Lightning to quicken, Ice to preserve, Earth to endure. Four Wardens keep the four breaths, and teach them to each hatchling in turn."},sanc2:{level:"sanctum",title:"The Violet Line",text:"Once in an age a dragon hatches who can learn every breath. The last such dragon grew hungry for a fifth, and the hunger hollowed him out."},falls1:{level:"falls",title:"Stormspire",text:"Lightning strikes the spire nine hundred times a year. Stormcrest claims to have counted every one. Nobody has checked."},falls2:{level:"falls",title:"The Last Roc",text:"The storm rocs once carried the Wardens' messages. The Gloom twisted the last of them into something that only screams."},falls3:{level:"falls",title:"Rain Bell",text:"Ring once for rain, twice for thunder. Never three times."},frost1:{level:"frostworks",title:"The Frostworks",text:"Built to keep the Sanctum's harvest through the long winters, the ice forges now hammer out chains of rime for the Hollow King."},frost2:{level:"frostworks",title:"Frostfang's Verse",text:"Cold is not cruel. Cold is patient. Cold remembers the shape of everything it holds."},frost3:{level:"frostworks",title:"Golem Plans",text:"A golem needs a core. A core needs a heart that will not stop. The Forgemaster found one."},plains1:{level:"plains",title:"The Stonewild",text:"Grass as tall as a Warden, and under it stone older than dragons. Stonehide says the plains are only resting."},plains2:{level:"plains",title:"Burrow Signs",text:"When the ground hums, stand still. When it stops humming, run."},plains3:{level:"plains",title:"The Standing Stones",text:"Each stone marks a Warden who fell defending the Sanctum. There are more stones every age."},keep1:{level:"keep",title:"Nyxa",text:"She was taken from the Sanctum as an egg on the same Eclipse night. The shadow raised her. The shadow is all she remembers."},keep2:{level:"keep",title:"The Hollow King",text:"He does not sleep, he does not eat, he does not age. He only waits for the moons to align again."},keep3:{level:"keep",title:"The Last Page",text:"If a violet dragon rises again, they will stand where I stood, and choose what I could not. (Torn from a Warden's journal.)"}},X1=(()=>{const a=new ne(.08,.2,1,5);return a.translate(0,.5,0),a})(),q1=zd({under:3814436,shore:5921330,grass:4880950,grass2:6195776,rock:6973018,path:8022600,high:6982218,highAt:4}),Y1={id:"fen",name:"Marshlight Fen",subtitle:"Where the fireflies keep their secrets",music:"fen",killY:-25,spawn:[0,2,Math.PI],sky:{top:2371678,horizon:14194810,bottom:2631738,sunDir:[.55,.28,-.6],sunColor:16763024,sunIntensity:1.9,hemiSky:10137824,hemiGround:3820074,hemiIntensity:1,fogNear:35,fogFar:190,stars:.4,fog:11047056},water:{level:0,deep:1716774,shallow:3828298,glint:11593904,opacity:.86},terrain:{x0:-80,z0:-40,sizeX:160,sizeZ:290,cell:1.5,color:q1,shape:a=>{a.base(-2.4).noise(.9,.035,3),a.island(0,0,17,1,5,.4),a.island(-13,-15,6,.4,3,.2),a.path([[0,14,1],[3,24,.7],[-1,32,.6]],5,3),a.island(1,38,2.2,.8,1.2,0),a.island(-2,43.5,2.2,.9,1.2,0),a.island(2,49,2.2,1,1.2,0),a.island(0,58,5,1,2,.2),a.island(0,77,13,3.4,3,.3),a.island(-32,83,4.5,2,2,.1),a.island(0,122,15,1.2,4,.3),a.path([[-14,121,1.2],[-26,119,1.3]],4,2),a.island(-40,118,7,1.4,3,.2),a.path([[14,124,1.2],[24,130,.9]],4,2),a.island(38,142,17,-.42,3,.1),a.island(31,135,3.2,1.2,2,.1),a.island(47,146,3.2,1.4,2,.1),a.island(38,154,3.2,1,2,.1),a.island(46,132,3.5,1,2,.1),a.path([[38,156,1],[26,162,1.2],[16,166,1.4]],5,3),a.island(6,174,18,1.4,4,.3),a.path([[-12,172,1.4],[-22,170,1.4]],4,2),a.island(-30,170,5.5,1.5,2,.1),a.path([[6,190,1.4],[2,198,1.2]],6,3),a.island(0,216,22,1.2,4,.2)}},build(a){const t=a.game;Fd(a,"firefly",14),a.bound(-78,-38,78,-38),a.bound(78,-38,78,248),a.bound(78,248,-78,248),a.bound(-78,248,-78,-38);const e=[16743088,10124031,8048895,16756826];[[-9,-4,3.4],[8,-7,3],[-6,9,2.6],[12,4,4],[-13,4,2.2]].forEach(([c,u,d],f)=>{a.mushroom(c,u,d,e[f%4],!0)});const i=a.y(12,4)+6.2;a.box(12,i-.4,4,5.2,.4,5.2,0,{noMesh:!0,surface:"mud"}),a.collectible("relic2","relic",12,4,i,"fen2"),a.shroom(6,10,17,16734874);for(let c=0;c<12;c++){const u=c/12*Math.PI*2;a.decor.lantern(Math.sin(u)*14,a.y(Math.sin(u)*14,Math.cos(u)*14),Math.cos(u)*14,c%2?16773280:10551216)}a.scatter(60,0,0,16,(c,u,d)=>a.decor.grass(c,d,u,.9,6989898)),a.scatter(24,0,0,15,(c,u,d)=>a.decor.flower(c,d,u,[16751312,16769136,12624127][Math.floor(Math.abs(Oi(c+u))*3)])),a.crystal(-4,-8,"blue",8),a.crystal(5,-10,"blue",8),a.crystal(-10,12,"red",3),a.crystal(3,13,"green",3),a.gemLine([[0,8],[0,16],[3,24]]),a.collectible("relic1","relic",-13,-16,void 0,"fen1"),a.box(-14,.1,-18.5,2.6,.25,1.6,9071172,{yaw:.4,surface:"wood"}),a.story("intro-move",0,6,5,()=>t.hud.flick("WASD to move, mouse to look. Race you to the old willow! Loser eats a beetle.",6)),a.story("crystals",0,-6,4,()=>t.hud.flick("Smash crystals with your horns (Left Mouse) for gems!",5)),a.scatter(40,0,25,14,(c,u,d)=>a.decor.reeds(c,d,u,1));for(let c=0;c<26;c++){const u=Oi(c,1)*14,d=20+c*1.6+Oi(c,2)*3;Math.abs(u)>4&&a.decor.lilypad(u,0,d,.6+Math.abs(Oi(c,3))*.5)}a.story("jump",-1,33,3,()=>t.hud.flick("Space to jump across the stones!",5)),a.gems(1,38,"blue",1),a.gems(-2,43.5,"blue",1),a.gems(2,49,"blue",1),a.story("flap",0,60,4,()=>t.hud.flick("Too high to jump? Press Space again in mid-air to flap your wings!",6)),a.gemLine([[0,60],[0,64]],"blue",1),a.tree(0,79,2.3,"willow",{leaf:4880960}),a.scatter(18,0,77,12,(c,u)=>{Math.hypot(c,u-79)>4&&a.tree(c,u,.8+Math.abs(Oi(c))*.5,"round",{leaf:4157234})},(c,u)=>Math.hypot(c,u-77)>7),a.scatter(50,0,77,12,(c,u,d)=>a.decor.grass(c,d,u,1,5937730));const n=a.arena("willow",0,75,11,[[{type:"grunt",x:-5,z:80},{type:"grunt",x:5,z:80,delay:.3}],[{type:"grunt",x:-6,z:70},{type:"grunt",x:6,z:70,delay:.2},{type:"grunt",x:0,z:82,delay:.5}]],30);n.onStart=()=>{t.save.found["story:fen:gloomFirst"]||(t.save.found["story:fen:gloomFirst"]=!0,t.say([{who:"flick",text:"Uh, Aster? Those are NOT swamp toads."},{who:"gloom",text:"Hssss... the violet one. The master wants it."},{who:"aster",text:'Master? Who are you calling "it"?!'},{who:"flick",text:"Horns! Use your horns! Left Mouse, and keep clicking for a combo!"}],()=>t.hud.flick("Tap Shift to dodge. Dodge right before a hit to slow time and counter!",7)))},n.onClear=()=>t.hud.flick("Nice! Hold Space after a flap to glide. Those ruins up the steps are the way north.",7),a.stairs(0,86.5,4,0,3.4,8,7),a.platform(0,8,93.5,8,5,11050634),a.pillar(-3.4,95.5,.5,8,10.5),a.pillar(3.4,95.5,.5,8,10.5),a.story("glide",0,93,3,()=>t.hud.flick("Jump, flap, then HOLD Space to glide over the water!",6)),a.gemLine([[0,100],[0,106]],"blue",2),a.collectible("mana1","mana",-32,83),a.crystal(-30,81,"green",4),a.checkpoint("ruins",0,115,0),a.story("wardstone",0,115,5,()=>t.hud.flick("A Wardstone! It saves your progress. Press F to spend blue gems on abilities.",7)),a.arch(0,128,0,6,5),[[-8,118],[8,119],[-10,128],[10,130],[-4,133],[5,134]].forEach(([c,u],d)=>a.decor.pillar(c,a.y(c,u),u,.6,3+d%3,12103064,d%2===0)),a.collectible("relic3","relic",6,124,void 0,"fen3"),a.box(6,a.y(6,124)-.2,124.9,1.6,1.2,.5,9077362),a.scatter(40,0,122,13,(c,u,d)=>a.decor.grass(c,d,u,.9,5933634)),a.crystal(-6,112,"blue",10,!0),a.crystal(8,113,"red",3);const s=-9,r=136,o=a.y(s,r);a.wall(s-4,r-3,s-4,r+3,o,4),a.wall(s+4,r-3,s+4,r+3,o,4),a.wall(s-4,r+3,s+4,r+3,o,4),a.platform(s,o+4.4,r,9,7,9077362,.4),a.gate(s,r-3,7,4,0,"stone","fen-shrine"),a.switchCrystal(s-6,r-5,"lightning","fen-shrine"),a.crystal(s,r+1,"mixed",40,!0),a.gate(-18,121,4,3.5,Math.PI/2+.15,"rock"),a.wall(-18,117,-18,119,1.2,4,1.2),a.wall(-18,123,-18,125,1.2,4,1.2),a.collectible("heart2","heart",-41,118),a.crystal(-38,122,"blue",12),a.tree(-43,114,1.2,"dead"),a.gate(14,124.5,4.5,3,Math.PI/2-.4,"wood"),a.story("charge",10,124,4,()=>t.hud.flick("A barricade! Hold Shift to charge straight through it!",6)),a.scatter(50,38,142,16,(c,u,d)=>a.decor.reeds(c,d,u,1.1),()=>!0);for(let c=0;c<30;c++)a.decor.lilypad(38+Oi(c,5)*15,0,142+Oi(c,6)*15,.7);a.enemy("slinger",31,135,Math.PI),a.enemy("slinger",47,146,Math.PI),a.enemy("grunt",36,142,Math.PI),a.enemy("grunt",42,138,Math.PI),a.story("dodge",28,131,5,()=>t.hud.flick("They're throwing shadow bolts! Dodge (Shift) just before they hit, or bat them back with your horns!",7)),a.shroom(44,131,19,16734874),a.pillar(53,126,2.6,-2,9.5,9077362),a.collectible("heart1","heart",53,126,9.5),a.crystal(38,154,"blue",8),a.crystal(47,147,"green",3),a.gemLine([[26,130],[31,135]]);for(let c=0;c<26;c++){const u=c/26*Math.PI*2,d=16.5,f=6+Math.sin(u)*d,m=174+Math.cos(u)*d;Math.abs(Math.cos(u)+.9)<.3||Math.abs(Math.cos(u)-.95)<.2||Math.abs(Math.sin(u)+1)<.15||a.decor.add(X1,at(4863012,{rough:1}),f,a.y(f,m),m,1,2+c%3*.4,1,Math.sin(u)*.25,0,Math.cos(u)*.25)}[[0,180],[14,170],[-2,166]].forEach(([c,u])=>$1(a,c,u));const h=a.arena("camp",6,174,15,[[{type:"grunt",x:0,z:170},{type:"grunt",x:12,z:172},{type:"grunt",x:6,z:182,delay:.3}],[{type:"slinger",x:-4,z:178},{type:"slinger",x:16,z:178},{type:"grunt",x:6,z:166,delay:.4},{type:"grunt",x:2,z:180,delay:.6}],[{type:"shieldbearer",x:6,z:180},{type:"grunt",x:0,z:168,delay:.3},{type:"grunt",x:12,z:168,delay:.5}]],50);h.onStart=()=>t.hud.flick("A whole camp of them! Mix up Horn and Tail. The fancier your combos, the more gems they drop!",7);const l=()=>t.hud.flick("That one has a shield! Tail attacks (E) smash guards. Or get behind it!",7);h.onClear=()=>t.hud.flick("We did it! The trail keeps going north... it smells awful up there.",6),a.trigger(6,174,15,()=>{t.enemies.some(c=>c.alive&&c.def.id==="shieldbearer")&&l()},!1),a.gate(-11,172,4,3.5,Math.PI/2,"vines"),a.wall(-11,168,-11,170,1.4,4,1),a.wall(-11,174,-11,176,1.4,4,1),a.collectible("mana2","mana",-31,170),a.crystal(-28,173,"purple",3),a.crystal(-30,166,"blue",10),a.checkpoint("camp",8,191,0),a.scatter(30,6,174,16,(c,u,d)=>a.decor.grass(c,d,u,1,4880950)),a.scatter(22,0,216,21,(c,u)=>a.tree(c,u,1+Math.abs(Oi(c*3))*.6,"dead"),(c,u)=>Math.hypot(c,u-216)>17),a.scatter(30,0,216,20,(c,u,d)=>a.decor.glowCrystal(c,d,u,1.2,11554047),(c,u)=>Math.hypot(c,u-216)>12),z1(a,{id:"bogmaw",x:0,z:216,r:20.5,triggerX:0,triggerZ:204,triggerR:5,spawn:c=>new G1(c,0,c.col.groundAt(0,222,20,.3).y,222,Math.PI),intro:[{who:"flick",text:"Aster... the mud is moving.",action:()=>{t.fx.splash(0,1.2,222,9079386),t.fx.dust(0,1.2,222,30,5917232),t.shake(.6,1),t.sfx("bossRoar",0,1,222)}},{who:"bogmaw",text:"GRRRAAAHHH! Little violet morsel! The Master promised you to Bogmaw!"},{who:"aster",text:"Nobody is eating anybody today!"},{who:"flick",text:"Watch his belly flop, jump over the shockwave! Hit him hard enough and he'll stagger!"}],onDefeated:c=>J1(c)}),t.save.levelsDone.fen&&a.portal(0,226,Math.PI,"sanctum","Return to the Sanctum",16751184)},onEnter(a,t){t&&!a.save.found["story:fen:intro"]&&(a.save.found["story:fen:intro"]=!0,a.say([{who:"flick",text:"Aster! Aster, wake up! The fireflies are lighting the lanterns without us!"},{who:"aster",text:"Five more minutes, Flick..."},{who:"flick",text:"You said that an hour ago. Also you're lying on Mother Glimmer's flower bed. Again."},{who:"aster",text:"Fine, fine. I'm up. What's the big hurry?"},{who:"flick",text:"The big hurry is the race you promised me. First one to the old willow wins. Go!"}]))}};function $1(a,t,e){const i=a.y(t,e);a.box(t,i,e,3,2.5,3,3811400,{noMesh:!0}),a.decor.add(Z1(),K1(),t,i,e,2.2,3.2,2.2,0,Oi(t)*3,0),a.decor.glowCrystal(t+1.8,i,e+1.8,1,11554047)}function Z1(){return jt.cone()}function K1(){return at(3811400,{rough:.95,flat:!0})}function J1(a){const t=a.level;if(!t||t.def.id!=="fen")return;const e=6,i=208,n=a.col.groundAt(e,i,30,.3).y,s=new Ud(a,"emberhold",th,e,n,i,Math.PI);t.npcs.push(s),a.fx.explosion(e,n+1,i,2,16752704),a.sfx("fireBurst",e,n,i),a.say([{who:"emberhold",text:"Stand easy, little one. That was bravely done."},{who:"aster",text:"You're... a dragon. Like me."},{who:"emberhold",text:"Not quite like you. No dragon has worn scales your color in a very long time."},{who:"flick",text:"Hey! Back off, big guy. He's with me."},{who:"emberhold",text:"Peace, firefly. I am Emberhold, Warden of Fire. Twelve years ago I set an egg on this river and prayed the shadow would never find it."},{who:"emberhold",text:"It has found you now. The Gloom does not raid firefly marshes by chance. It came for you."},{who:"aster",text:"Then teach me how to fight it."},{who:"emberhold",text:"Come to the Warden Sanctum. You have a fire in you that has not woken yet. Let us wake it."}],()=>{a.save.levelsDone.fen=!0,a.save.unlocked.includes("sanctum")||a.save.unlocked.push("sanctum"),a.saveNow(),a.travel("sanctum")})}const Q1=zd({under:6974066,shore:9079418,grass:6986314,grass2:8038484,rock:10130568,path:13155492,high:9087072,highAt:6,water:-100}),an=13155492,Dn=10129536,j1={id:"sanctum",name:"Warden Sanctum",subtitle:"The temple above the clouds",music:"sanctum",killY:-18,spawn:[0,-18,0],sky:{top:3828408,horizon:15779984,bottom:16312528,sunDir:[-.5,.35,.6],sunColor:16769200,sunIntensity:2.2,hemiSky:12638463,hemiGround:9075296,hemiIntensity:1.05,fogNear:60,fogFar:260},terrain:{x0:-80,z0:-60,sizeX:160,sizeZ:150,cell:1.5,color:Q1,skirt:{depth:16,color:9077364},shape:a=>{a.void(),a.island(0,0,32,0,3,.2),a.island(0,44,13,4.5,2,.1),a.path([[0,28,0],[0,33,0]],8,1),a.island(46,4,15,.2,2,.2),a.island(-46,-6,13,1,2,.2),a.island(-24,-34,6,3,1.5,.1),a.island(-38,-42,5,6,1.5,.1),a.island(22,-40,5,1.5,1.5,.1)}},build(a){const t=a.game;Fd(a,"pollen",10);const e=new Nd(-16,700,15784136,16774376,16777215,.95);a.level.root.add(e.mesh),a.level.props.push({update:()=>e.update(t.realTime*.3,t.camera.position.x,t.camera.position.z)}),a.platform(0,.25,0,26,26,an,.5,{trim:Dn});for(let s=0;s<12;s++){const r=s/12*Math.PI*2+Math.PI/12,o=Math.sin(r)*17,h=Math.cos(r)*17;Math.abs(o)<5&&h>0||(s%3===1?a.decor.pillar(o,0,h,.8,3.5,an,!0):a.pillar(o,h,.8,-1,7,an))}a.torch(0,0,"hearth",!0,0,.25);const i=[[-8,-8,th,"fire"],[8,-8,bc,"lightning"],[8,8,Sc,"ice"],[-8,8,Tc,"earth"]];for(const[s,r,o,h]of i)ty(a,s,r,o,t.save.elements.includes(h));a.stairs(0,28.5,7,0,.25,4.5,6),a.platform(0,4.6,44,22,18,an,.6,{trim:Dn}),a.arch(-9,40,0,3,5,an),a.arch(9,40,0,3,5,an),a.portal(0,48,Math.PI,"wardgate","Step through the Wardgate",13214463,()=>t.menus.showTravel()),a.gate(0,34.5,8,5,0,"stone","wardgate-open",.25),t.save.found["story:sanctum:lesson-done"]&&a.level.emit("wardgate-open"),a.checkpoint("courtyard",-5,20,Math.PI),a.bridge(16,2,.25,32,3,.2,4),a.platform(46,.4,4,18,18,Dn,.4,{trim:an});const n=[[42,0],[50,0],[46,9],[40,8],[52,8]];for(const[s,r]of n)iy(t,s,r);a.torch(38,-4,"lesson",!1,0,.4),a.torch(54,-4,"lesson",!1,0,.4),a.torch(38,12,"lesson",!1,0,.4),a.torch(54,12,"lesson",!1,0,.4),a.torchGroup("lesson","lesson-torches"),a.level.on("lesson-torches",()=>ay(t)),a.crystal(58,2,"green",6),a.crystal(58,7,"red",4),a.bridge(-16,-2,.25,-34,-5,1,3.5),a.platform(-46,1.2,-6,14,14,an,.5,{trim:Dn});for(let s=0;s<8;s++){const r=s/8*Math.PI*2;ey(a,-46+Math.sin(r)*4,-6+Math.cos(r)*4,1.2)}a.collectible("relic1","relic",-46,-6,1.2,"sanc1"),a.wall(-53,-13,-39,-13,1.2,3,1,Dn),a.wall(-53,-13,-53,1,1.2,2.2,1,Dn),a.islet(-30,3,-24,2.2,6986314),a.collectible("relic2","relic",-38,-42,void 0,"sanc2"),a.collectible("mana1","mana",-24,-34),a.updraft(-30,-24,2,3,12,30),a.islet(-8,5,-38,2.5,6986314),a.islet(8,3,-40,2.5,6986314),a.collectible("heart1","heart",22,-40),a.gemLine([[-8,-38],[8,-40],[22,-40]]),a.crystal(20,-42,"blue",15),a.scatter(50,0,0,30,(s,r,o)=>a.decor.grass(s,o,r,.9,6986314),(s,r)=>Math.hypot(s,r)>18),a.scatter(18,0,0,30,(s,r)=>a.tree(s,r,1+Math.abs(Oi(s+r))*.5,"round",{leaf:5933626}),(s,r)=>Math.hypot(s,r)>21&&Math.abs(s)>6),a.scatter(20,46,4,14,(s,r,o)=>a.decor.flower(s,o,r,16765040),(s,r)=>Math.abs(s-46)>9||Math.abs(r-4)>9),a.npc("emberhold",th,4,8,Math.PI*.8,"Talk to Emberhold",()=>ry(t)),t.save.levelsDone.falls&&a.npc("stormcrest",bc,12,22,-Math.PI*.8,"Talk to Stormcrest",()=>Fa(t,"stormcrest")),t.save.levelsDone.frostworks&&a.npc("frostfang",Sc,-12,22,Math.PI*.8,"Talk to Frostfang",()=>Fa(t,"frostfang")),t.save.levelsDone.plains&&a.npc("stonehide",Tc,-14,6,Math.PI*.5,"Talk to Stonehide",()=>Fa(t,"stonehide")),t.save.levelsDone.keep&&a.npc("nyxa",W1,14,6,-Math.PI*.5,"Talk to Nyxa",()=>Fa(t,"nyxa"))},onEnter(a,t){if(!a.save.found["story:sanctum:arrive"]){a.save.found["story:sanctum:arrive"]=!0,a.say(ny,()=>sy(a));return}if(!a.save.found["story:sanctum:lesson-done"]&&a.save.elements.includes("fire")){a.hud.flick("Emberhold wanted us on the training grounds to the east. Burn those dummies!",6);return}const e=[["falls","story:sanctum:back-falls",oy],["frostworks","story:sanctum:back-frost",hy],["plains","story:sanctum:back-plains",ly]];for(const[i,n,s]of e)if(a.save.levelsDone[i]&&!a.save.found[n]){a.save.found[n]=!0,a.say(s,()=>a.saveNow());return}t&&a.hud.flick("The Wardgate is up the north stairs. Wardstones let you spend gems on new abilities.",5)}};function ty(a,t,e,i,n){a.box(t,.25,e,3,1.2,3,Dn,{trim:an});const r={...i,body:11050634,belly:12103322,horn:n?i.body:9077362,membrane:10129536,spikes:9077362,eye:n?i.eye:6972504,scale:1.3},o=new Ph(r),h=Ch();h.attack="roar",h.attackT=.5;for(let l=0;l<30;l++)o.update(.05,h);o.root.position.set(t,.25+1.2,e),o.root.rotation.y=Math.atan2(-t,-e),o.root.traverse(l=>{l.isMesh&&(l.castShadow=!0)}),a.level.root.add(o.root),a.col.add(hi(t,e,1.5,.25,.25+3.5)),n&&a.beacon(t,.25+5,e,i.eye,.6)}function ey(a,t,e,i){const n=new J(new wi(.5,12,10),new Ki({color:6971504,roughness:.4}));n.scale.set(1,1.3,1),n.position.set(t,i+.6,e),n.castShadow=!0,a.level.root.add(n);const s=new J(new bi(.55,.18,6,14),new Ki({color:8018490,roughness:1}));s.rotation.x=Math.PI/2,s.position.set(t,i+.15,e),a.level.root.add(s)}function iy(a,t,e){const i=a.col.groundAt(t,e,20,.2).y,n=()=>{const s=a.spawnEnemy("dummy",t,i+.05,e,Math.PI,!1);s.onDeath=()=>{setTimeout(()=>{a.level?.def.id==="sanctum"&&(n(),a.fx.sparkle(t,i+1,e,16106603,10))},3e3)}};n()}const ny=[{who:"emberhold",text:"Welcome to the Warden Sanctum, Aster. Or what the Hollow King left of it."},{who:"flick",text:"Whoa. It's... floating. Why is it floating?"},{who:"emberhold",text:"Because it was built by dragons, firefly. We do not care for walking."},{who:"emberhold",text:"Four Wardens once taught the four breaths here. Fire, lightning, ice and earth. On the night of the Eclipse, three of them were taken."},{who:"aster",text:"Taken by who?"},{who:"emberhold",text:"By a young shadow dragoness named Nyxa. She serves the Hollow King now. I escaped only because I stayed to save one egg."},{who:"aster",text:"Me."},{who:"emberhold",text:"You. Now, let us see if you have your father's fire. Come to me."}];function sy(a){a.learnElement("fire"),a.say([{who:"emberhold",text:"Breathe in. Feel the heat under your scales. Now let it out.",action:()=>a.fx.explosion(a.player.x,a.player.y+1,a.player.z,1.5,16752704)},{who:"aster",text:"I... I breathed FIRE!"},{who:"flick",text:"You singed my wings! Watch where you point that thing!"},{who:"emberhold",text:"Hold your right claw (Right Mouse) to breathe flame. It burns your mana, the green light, so watch it."},{who:"emberhold",text:"Press Q to hurl a fireball. Go to the training grounds east of here. Burn the dummies, then light the four braziers."}],()=>a.hud.flick("Training grounds are across the east bridge. Hold Right Mouse to breathe fire, Q for a fireball!",7))}function ay(a){a.save.found["story:sanctum:lesson-done"]||(a.save.found["story:sanctum:lesson-done"]=!0,a.save.unlocked.includes("falls")||a.save.unlocked.push("falls"),a.level?.emit("wardgate-open"),a.player.fury=100,a.say([{who:"emberhold",text:"Well done! Now: fire is anger made useful. Strike hard and fast, and fury builds inside you."},{who:"emberhold",text:"When the ring around your emblem glows, press X to release your Fury. I have lent you mine. Try it."},{who:"emberhold",text:"And one thing more. Hold C and the world will slow for you. We call it Dragon Time."},{who:"emberhold",text:"Stormcrest, the Lightning Warden, was dragged to Stormspire Falls. The Wardgate at the top of the north stairs is open."},{who:"aster",text:"Then that's where I'm going."},{who:"emberhold",text:"Wardstones like the one by the stairs will let you spend the spirit gems you gather. Grow strong, Aster."}],()=>a.saveNow()))}function ry(a){const t=a.save;let e;t.found["story:sanctum:lesson-done"]?t.levelsDone.falls?t.levelsDone.keep?e=[{who:"emberhold",text:"The Sanctum has two young dragons again. I had stopped hoping I would ever say that."}]:e=[{who:"emberhold",text:"Every Warden you free makes you stronger, and makes Nyxa more desperate."},{who:"emberhold",text:"Combine your breaths. Fire on a shocked enemy overloads. Ice on a burning one bursts into steam."}]:e=[{who:"emberhold",text:"Stormcrest waits at Stormspire Falls. Take the Wardgate at the top of the north stairs."},{who:"emberhold",text:"Remember: a guarded foe fears your tail. A burning foe fears ice. And a frozen foe shatters under a heavy blow."}]:e=[{who:"emberhold",text:"The training grounds are across the east bridge. Burn the dummies, then light all four braziers with fire."}],a.say(e)}function Fa(a,t){const e={stormcrest:[{who:"stormcrest",text:"Kid! Hey! Did you know that lightning is five times hotter than the sun? I read it. Well, I made it up. But it FEELS true."},{who:"stormcrest",text:"Arc Breath jumps between enemies. More targets, more fun. Shock them and they take extra damage from everything!"}],frostfang:[{who:"frostfang",text:"Patience, young one. Chill an enemy enough and it freezes solid. Then strike with your tail, and it shatters like winter glass."}],stonehide:[{who:"stonehide",text:"...Earth does not hurry. Earth does not need to."},{who:"stonehide",text:"My Boulder cracks stone walls. There may be old walls in places you have already been."}],nyxa:[{who:"nyxa",text:"I keep waking up and expecting the voice to be there. It isn't. It's very quiet without it."},{who:"aster",text:"Quiet's not so bad. You get used to it."}]};a.say(e[t]??[])}const oy=[{who:"emberhold",text:"Stormcrest is home, and his lightning is yours. You have done in days what I could not do in years."},{who:"emberhold",text:"Frostfang, our Ice Warden, is chained in the Frostworks, the old ice forges. The Wardgate will take you there."},{who:"flick",text:"Ice forges. Great. My wings are going to freeze off."}],hy=[{who:"emberhold",text:"Frostfang returns, and so does the cold wisdom of ice. Only Stonehide remains."},{who:"emberhold",text:"He was taken to the Stonewild Plains. The ground itself has turned on the Sanctum there."}],ly=[{who:"emberhold",text:"All four breaths, in one young dragon. It has not happened in a thousand years."},{who:"emberhold",text:"Nyxa will come for you now with everything she has. Better we go to her. Eclipse Keep lies open through the Wardgate."},{who:"aster",text:"I'm ready."},{who:"emberhold",text:"No one is ever ready, Aster. Go anyway."}],cy={fen:Y1,sanctum:j1},Ec={fire:"#ff7a2a",lightning:"#7ac8ff",ice:"#8fe4ff",earth:"#8bd05a"},dy={fire:"1",lightning:"2",ice:"3",earth:"4"},Ac={fire:[60,16],lightning:[104,60],ice:[60,104],earth:[16,60]},so=["#b8b0d0","#ffb070","#ff8a3a","#ff5a3a","#ff3a8a","#e0a0ff"];function Ut(a,t="",e=""){const i=document.createElement(a);return t&&(i.className=t),e&&(i.innerHTML=e),i}class uy{constructor(t,e){this.game=t,this.overlay=Ut("div","ui-layer"),this.root=Ut("div","ui-layer"),e.appendChild(this.overlay),e.appendChild(this.root),this.build()}game;root;overlay;hpFill;hpLag;manaFill;dtFill;hpBar;manaBar;furyArc;furyRing;gemText;gemsBox;shardsBox;elBoxes=new Map;elName;styleBox;styleRank;styleName;styleBarFill;comboBox;promptBox;toasts;bossBox;bossFill;bossLag;bossName;bossPhase;vignette;lowhp;fadeBox;perfectBox;reticle;flickBox;flickText;deathBox;nums=[];boss=null;hurtT=0;flickT=0;lastToast=new Map;relicBox=null;relicT=0;wardT=0;proj=new C;build(){const t=this.root,e=this.overlay;this.vignette=Ut("div","vignette"),this.lowhp=Ut("div","lowhp"),this.perfectBox=Ut("div","perfect-flash"),e.append(this.vignette,this.lowhp,this.perfectBox);const i=Ut("div","hud-tl"),n=Ut("div","hud-emblem");n.innerHTML='<svg viewBox="0 0 64 64"><path d="M32 12 L38 26 L52 28 L41 37 L44 51 L32 44 L20 51 L23 37 L12 28 L26 26 Z" fill="#f5c46b" opacity=".9"/></svg>',this.furyRing=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.furyRing.setAttribute("viewBox","0 0 76 76"),this.furyRing.classList.add("fury-ring"),this.furyRing.innerHTML=`<circle cx="38" cy="38" r="35" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="5"/>
      <circle class="arc" cx="38" cy="38" r="35" fill="none" stroke="#c070ff" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="220" stroke-dashoffset="220" transform="rotate(-90 38 38)"/>`,this.furyArc=this.furyRing.querySelector(".arc"),this.furyRing.style.width="76px",this.furyRing.style.height="76px",n.appendChild(this.furyRing);const s=Ut("div","bars");this.hpBar=Ut("div","bar hp"),this.hpLag=Ut("i","lag"),this.hpFill=Ut("i","fill"),this.hpBar.append(this.hpLag,this.hpFill),this.manaBar=Ut("div","bar mana"),this.manaFill=Ut("i","fill"),this.manaBar.append(this.manaFill);const r=Ut("div","bar thin dt");this.dtFill=Ut("i","fill"),r.append(this.dtFill),s.append(this.hpBar,this.manaBar,r),i.append(n,s),t.appendChild(i);const o=Ut("div","hud-tr");this.gemsBox=Ut("div","gems"),this.gemText=Ut("span","","0"),this.gemsBox.append(Ut("i","gem-icon"),this.gemText),this.shardsBox=Ut("div","shards"),o.append(this.gemsBox,this.shardsBox),t.appendChild(o);const h=Ut("div","hud-br"),l=Ut("div","elements");for(const f of["fire","lightning","ice","earth"]){const m=Ut("div","el",`<span>${dy[f]}</span>`);m.style.left=`${Ac[f][0]}px`,m.style.top=`${Ac[f][1]}px`,m.style.setProperty("--c",Ec[f]),l.appendChild(m),this.elBoxes.set(f,m)}this.elName=Ut("div","el-name",""),h.append(l,this.elName,Ut("div","el-keys","Hold RMB: Breath &middot; Q: Burst")),t.appendChild(h),this.styleBox=Ut("div","style-meter"),this.styleRank=Ut("div","style-rank","D"),this.styleName=Ut("div","style-name","");const c=Ut("div","style-bar");this.styleBarFill=Ut("i"),c.appendChild(this.styleBarFill),this.comboBox=Ut("div","combo"),this.styleBox.append(this.styleRank,this.styleName,c,this.comboBox),t.appendChild(this.styleBox),this.promptBox=Ut("div","prompt"),this.promptBox.style.opacity="0",t.appendChild(this.promptBox),this.toasts=Ut("div","toasts"),t.appendChild(this.toasts),this.bossBox=Ut("div","boss"),this.bossName=Ut("div","boss-name");const u=Ut("div","bar");this.bossLag=Ut("i","lag"),this.bossFill=Ut("i","fill"),u.append(this.bossLag,this.bossFill),this.bossPhase=Ut("div","boss-phase"),this.bossBox.append(this.bossName,u,this.bossPhase),this.bossBox.style.display="none",t.appendChild(this.bossBox),this.reticle=Ut("div","reticle"),this.reticle.style.display="none",t.appendChild(this.reticle),this.flickBox=Ut("div","flick hidden"),this.flickText=Ut("p");const d=Ut("div");d.append(Ut("b","","FLICK"),this.flickText),this.flickBox.append(Ut("div","flick-face"),d),t.appendChild(this.flickBox),this.deathBox=Ut("div","death","<h1>The light fades...</h1>"),e.appendChild(this.deathBox),this.fadeBox=Ut("div","fade"),e.appendChild(this.fadeBox)}show(t){this.root.classList.toggle("hidden",!t)}fade(t){this.fadeBox.style.opacity=String(t)}update(t){const e=this.game,i=e.player,n=Math.max(0,i.hp/i.maxHp);this.hpFill.style.width=`${n*100}%`,this.hpLag.style.width=`${n*100}%`,this.hpBar.style.width=`${200+(i.maxHp-100)*.8}px`,this.manaFill.style.width=`${Math.max(0,i.mana/i.maxMana)*100}%`,this.manaBar.style.width=`${200+(i.maxMana-100)*.8}px`,this.dtFill.style.width=`${i.dtime/i.dtimeMax*100}%`,this.furyArc.setAttribute("stroke-dashoffset",String(220-i.fury/100*220)),this.furyRing.classList.toggle("ready",i.fury>=100),this.gemText.textContent=String(e.save.gems);const s=e.save.heartShards%wn,r=e.save.manaShards%wn,o=`<span style="color:#ff8a9a">&#9829; <b>${s}</b>/4</span><span style="color:#8af0aa">&#9670; <b>${r}</b>/4</span>`;this.shardsBox.innerHTML!==o&&(this.shardsBox.innerHTML=o);const h=e.save.elements;for(const[v,p]of this.elBoxes)p.classList.toggle("owned",h.includes(v)),p.classList.toggle("active",i.element===v);this.elName.textContent=i.element?Ax[i.element]:h.length?"":"No element yet",this.elName.style.color=i.element?Ec[i.element]:"#a99cc9";const l=e.style,c=l.rank,u=l.points>1||l.combo>1;if(this.styleBox.style.opacity=u?"1":"0",this.styleRank.textContent=ki[c].letter,this.styleRank.style.color=so[c],this.styleName.textContent=ki[c].name,this.styleName.style.color=so[c],this.styleBarFill.style.width=`${l.progress*100}%`,this.styleBarFill.style.color=so[c],this.comboBox.innerHTML=l.combo>1?`${l.combo} <small>HITS</small>`:"",this.hurtT=Math.max(0,this.hurtT-t),this.vignette.style.opacity=String(Math.min(1,this.hurtT*2)),this.lowhp.style.opacity=n<.25&&i.alive?"1":"0",this.boss){const v=Math.max(0,this.boss.hp/this.boss.maxHp);this.bossFill.style.width=`${v*100}%`,this.bossLag.style.width=`${v*100}%`;const p=this.boss.phases;let g="";for(let y=0;y<p;y++)g+=`<i class="${y<this.boss.phase?"on":""}"></i>`;this.bossPhase.innerHTML!==g&&(this.bossPhase.innerHTML=g),!this.boss.alive&&this.boss.deadT>1.5&&this.bossBar(null)}const d=i.lock;if(d&&d.alive){const v=this.toScreen(d.x,d.y+d.height*.6,d.z);v?(this.reticle.style.display="block",this.reticle.style.left=`${v[0]}px`,this.reticle.style.top=`${v[1]}px`):this.reticle.style.display="none"}else this.reticle.style.display="none";for(const v of this.nums){v.t+=t,v.y+=v.vy*t,v.vy-=4*t;const p=this.toScreen(v.x,v.y,v.z);p&&v.t<.9?(v.e.style.display="block",v.e.style.left=`${p[0]}px`,v.e.style.top=`${p[1]}px`,v.e.style.opacity=String(Math.min(1,(.9-v.t)*3))):v.e.style.display="none"}const f=this.nums.filter(v=>v.t>=.9);for(const v of f)v.e.remove();f.length&&(this.nums=this.nums.filter(v=>v.t<.9));const m=e.state==="dialogue";this.flickT>0&&(this.flickBox.classList.toggle("hidden",m),m||(this.flickT-=t,this.flickT<=0&&this.flickBox.classList.add("hidden"))),this.relicBox&&(this.relicT-=t,(this.relicT<=0||this.relicT<7&&(e.input.pressed("confirm")||e.input.pressed("interact")))&&(this.relicBox.remove(),this.relicBox=null)),this.wardT-=t}toScreen(t,e,i){const n=this.proj.set(t,e,i).project(this.game.camera);return n.z>1||n.z<-1?null:[(n.x*.5+.5)*window.innerWidth,(-n.y*.5+.5)*window.innerHeight]}prompt(t){if(t){const e=`<kbd>F</kbd>${t}`;this.promptBox.innerHTML!==e&&(this.promptBox.innerHTML=e),this.promptBox.style.opacity="1"}else this.promptBox.style.opacity="0"}toast(t,e="info"){const i=performance.now();if((this.lastToast.get(t)??0)>i-1500)return;this.lastToast.set(t,i);const n=Ut("div",`toast ${e}`,t);for(this.toasts.appendChild(n);this.toasts.children.length>4;)this.toasts.firstChild.remove();setTimeout(()=>n.classList.add("out"),2200),setTimeout(()=>n.remove(),2800)}bigText(t,e){const i=Ut("div","big-text",t);i.style.color=`#${e.toString(16).padStart(6,"0")}`,this.root.appendChild(i),setTimeout(()=>i.remove(),1200)}levelTitle(t,e){const i=Ut("div","level-title",`<h1>${t}</h1><div class="rule"></div><p>${e}</p>`);this.root.appendChild(i),setTimeout(()=>i.remove(),4600)}number(t,e,i,n,s,r){if(this.nums.length>30)return;const o=Ut("div",`dmg${r?" crit":""}`,String(n));o.style.color=`#${s.toString(16).padStart(6,"0")}`,o.style.display="none",this.root.appendChild(o),this.nums.push({e:o,x:t+(Math.random()-.5)*.6,y:e,z:i+(Math.random()-.5)*.6,t:0,vy:2.5})}bossBar(t){this.boss=t,this.bossBox.style.display=t?"block":"none",t&&(this.bossName.textContent=t.displayName)}hurt(t){this.hurtT=Math.max(this.hurtT,.3+t*2)}flashMana(){this.manaBar.classList.remove("flash"),this.manaBar.offsetWidth,this.manaBar.classList.add("flash")}furyReady(){this.flick("Your fury is full! Press X to unleash it!",4)}furyUsed(){this.perfectBox.style.opacity="1",setTimeout(()=>this.perfectBox.style.opacity="0",250)}perfect(){this.perfectBox.style.opacity="1",setTimeout(()=>this.perfectBox.style.opacity="0",350)}gemBump(){this.gemsBox.classList.remove("bump"),this.gemsBox.offsetWidth,this.gemsBox.classList.add("bump")}elementChanged(t){const e=this.elBoxes.get(t);e&&e.animate([{transform:"translate(-50%,-50%) rotate(45deg) scale(1.4)"},{transform:"translate(-50%,-50%) rotate(45deg) scale(1)"}],{duration:250})}dragonTime(t){this.game.renderer.canvas.classList.toggle("dtime",t)}flick(t,e=5){this.flickText.textContent=t,this.flickBox.classList.remove("hidden"),this.flickT=e}relic(t,e){this.relicBox?.remove(),this.relicBox=Ut("div","relic-card",`<div class="sub">Dragon Relic found</div><h2>${t}</h2><p>${e}</p><div class="hint">Read it again any time in the Journal.</div>`),this.root.appendChild(this.relicBox),this.relicT=9}wardHint(){this.wardT>0||(this.wardT=12,this.flick("A Gloom Totem is shielding them! Smash the totem first!",4))}death(t){this.deathBox.classList.toggle("on",t)}}const ao={horn:"Horns",tail:"Tail",wings:"Wings",spirit:"Spirit",fire:"Fire",lightning:"Lightning",ice:"Ice",earth:"Earth"},fy=[{name:"Horn Combo",input:"LMB, LMB, LMB",desc:"Three quick horn strikes. The third knocks enemies away."},{name:"Horn Cyclone",input:"LMB x4",desc:"A spinning fourth strike that hits everything around you.",requires:"hornFinisher"},{name:"Horn Toss",input:"LMB then E",desc:"Launches an enemy into the air. Hold Space to rise with it."},{name:"Air Combo",input:"LMB x3 in the air",desc:"Keeps you and your target aloft; the finisher spikes them down."},{name:"Tail Whip",input:"E, E",desc:"Spinning tail sweeps. Heavy: breaks guards, shatters ice."},{name:"Tail Smash",input:"E, E, E  or  LMB x3, E",desc:"An overhead slam that bounces enemies up."},{name:"Tail Cyclone",input:"Hold E",desc:"Spin like a top while you hold the button.",requires:"tailSpin"},{name:"Ground Pound",input:"E in the air",desc:"Dive and slam. Presses plates. Higher falls hit harder."},{name:"Dodge",input:"Shift",desc:"A quick dash with invulnerability. Works once in the air."},{name:"Perfect Dodge",input:"Shift just before a hit",desc:"Time slows. Press LMB for a devastating Counter."},{name:"Charge",input:"Hold Shift",desc:"Sprint horns-first, ramming anything in the way. LMB to Horn Dash."},{name:"Reflect",input:"LMB into a projectile",desc:"Bat enemy bolts back where they came from."},{name:"Flap and Glide",input:"Space in the air, hold",desc:"A second jump, then hold to glide. Ride updrafts upward."},{name:"Breath",input:"Hold RMB",desc:"Your element's breath. Costs mana over time.",element:!0},{name:"Burst",input:"Q",desc:"Your element's special attack. Costs a chunk of mana.",element:!0},{name:"Fury",input:"X when the ring is full",desc:"A screen-clearing elemental storm. Build it by fighting.",element:!0},{name:"Dragon Time",input:"Hold C",desc:"Slow the world while you move freely."},{name:"Lock On",input:"Tab / MMB",desc:"Frame a target; breath and bursts aim at it."}],py=[["Elemental Reactions","Freeze an enemy, then hit it with a heavy blow to SHATTER it. Fire on a shocked foe causes an OVERLOAD explosion. Ice on a burning foe makes a STEAM BURST that stuns a crowd."],["Style","Landing varied hits raises your style rank from Spark to Legendary. Higher ranks drop more gems and build fury faster. Getting hit costs you a rank."],["Guards and Shells","Shields block your horns and breath from the front. Circle behind, or use heavy Tail moves, Earth, or a Battering Ram charge. Shellbacks must be flipped with a heavy hit."],["Totems","Gloom Totems shield every enemy near them. Break the totem first."],["Gems","Blue gems are spirit: spend them at Wardstones. Red heals, green restores mana, purple feeds your fury."]];class my{constructor(t,e){this.game=t,this.layer=document.createElement("div"),this.layer.className="ui-layer",e.appendChild(this.layer)}game;layer;stack=[];tree="horn";get open(){return this.stack.length>0}hideAll(){for(const t of this.stack)t.el.remove();this.stack=[]}push(t,e,i){this.game.input.clearBuffers();const n=this.stack[this.stack.length-1];n&&(n.el.style.display="none"),this.layer.appendChild(t);const s={el:t,focus:[],idx:0,back:e,...i?{grid:i}:{}};return this.stack.push(s),this.refreshFocus(s),s}pop(){this.game.input.clearBuffers(),this.stack.pop()?.el.remove();const e=this.stack[this.stack.length-1];e&&(e.el.style.display="",this.refreshFocus(e))}replaceTop(t,e,i){this.stack.pop()?.el.remove(),this.push(t,e,i)}refreshFocus(t){t.focus=[...t.el.querySelectorAll("[data-f]")].filter(e=>!e.disabled),t.idx=Math.min(t.idx,Math.max(0,t.focus.length-1)),t.focus.forEach((e,i)=>{e.classList.toggle("focus",i===t.idx),e.onmouseenter=()=>{t.idx=i,t.focus.forEach((n,s)=>n.classList.toggle("focus",s===i))}})}update(t){const e=this.stack[this.stack.length-1];if(!e)return;const i=this.game.input,n=e.focus.length,s=e.grid??1;let r=!1;n&&(i.take("down",.2)&&(e.idx=(e.idx+s)%n,r=!0),i.take("up",.2)&&(e.idx=(e.idx-s+n)%n,r=!0),e.grid&&i.take("right",.2)&&(e.idx=(e.idx+1)%n,r=!0),e.grid&&i.take("left",.2)&&(e.idx=(e.idx-1+n)%n,r=!0),r&&(this.game.audio.play("ui"),e.focus.forEach((o,h)=>o.classList.toggle("focus",h===e.idx)),e.focus[e.idx]?.scrollIntoView({block:"nearest"})),(i.take("confirm",.2)||i.take("interact",.2))&&e.focus[e.idx]?.click()),i.take("back",.2)&&e.back&&(this.game.audio.play("uiBack"),e.back())}btn(t,e,i=!1,n="btn"){const s=document.createElement("button");return s.className=n,s.innerHTML=t,s.dataset.f="1",s.disabled=i,s.addEventListener("click",r=>{r.stopPropagation(),!s.disabled&&(this.game.audio.unlock(),this.game.audio.play("uiConfirm"),e())}),s}div(t,e=""){const i=document.createElement("div");return i.className=t,i.innerHTML=e,i}showTitle(){this.hideAll();const t=this.div("menu"),e=this.div("title-screen","<h1>WYRMLING</h1><h2>First Flight</h2>"),i=this.div("menu-list"),n=tr();n&&i.append(this.btn(`Continue <small style="opacity:.6">&middot; ${no[n.level]?.name??n.level}</small>`,()=>this.game.continueGame())),i.append(this.btn("New Game",()=>this.showDifficulty()),this.btn("Options",()=>this.showOptions()),this.btn("Controls",()=>this.showControls()),this.btn("Credits",()=>this.showCredits())),e.append(i),t.append(e,this.div("menu-foot","A fan-made elemental dragon adventure &middot; best with mouse and keyboard or a gamepad")),this.push(t,null)}showDifficulty(){const t=this.div("menu dim"),e=this.div("panel",'<h2>Choose your path</h2><div class="sub">You can change this later in Options.</div>'),i=this.div("menu-list"),n={story:"Enemies hit softly and fall quickly. For the tale.",normal:"The intended challenge. Learn the dodge.",hard:"Enemies are tougher, faster and hit hard. Perfect dodges required."};for(const s of["story","normal","hard"])i.append(this.btn(`${Sd[s].label}<br><small style="text-transform:none;letter-spacing:0;opacity:.7;font-family:system-ui">${n[s]}</small>`,()=>this.showPrologue(s)));tr()&&i.append(this.div("sub","<br>Starting a new game replaces your saved progress.")),e.append(i),t.append(e),this.push(t,()=>this.pop())}showPrologue(t){const e=this.div("menu dim");e.style.background="rgba(4,2,10,.92)";const i=this.div("crawl");wc.forEach((s,r)=>{const o=document.createElement("p");o.textContent=s,o.style.animationDelay=`${r*2.2}s`,i.append(o)});const n=this.btn("Begin",()=>this.game.newGame(t));n.style.marginTop="12px",n.style.opacity="0",n.style.animation=`crawlIn 1s ${wc.length*2.2}s forwards`,i.append(n),e.append(i),this.replaceTop(e,()=>this.game.newGame(t))}showCredits(){const t=this.div("menu dim"),e=this.div("panel lore",`<h2>Credits</h2>
      <div class="entry"><h4>Wyrmling: First Flight</h4><p>An original fan tribute to the elemental dragon adventures of the mid-2000s. Every model, texture, sound and note of music is generated by code at runtime.</p></div>
      <div class="entry"><h4>Built with</h4><p>TypeScript, three.js and the Web Audio API.</p></div>`);e.append(this.btn("Back",()=>this.pop())),t.append(e),this.push(t,()=>this.pop())}showPause(){this.hideAll();const t=this.game,e=this.div("menu dim"),i=this.div("panel");i.style.minWidth="360px",i.innerHTML=`<h2>Paused</h2><div class="sub">${t.level?.def.name??""}</div>`;const n=t.save.stats,s=Math.floor(n.playTime/60);i.append(this.div("stats",`<span>Spirit gems</span><b>${t.save.gems}</b><span>Enemies defeated</span><b>${n.kills}</b>
      <span>Best combo</span><b>${n.bestCombo}</b><span>Reactions</span><b>${n.reactions}</b><span>Time</span><b>${Math.floor(s/60)}h ${s%60}m</b>`));const r=this.div("menu-list");r.append(this.btn("Resume",()=>t.resume()),this.btn("Abilities",()=>this.showUpgrades()),this.btn("Moves",()=>this.showMoves()),this.btn("Journal",()=>this.showJournal()),this.btn("Options",()=>this.showOptions()),this.btn("Controls",()=>this.showControls())),t.level?.def.id!=="sanctum"&&t.save.unlocked.includes("sanctum")&&r.append(this.btn("Return to the Sanctum",()=>{this.hideAll(),t.travel("sanctum")})),r.append(this.btn("Save &amp; Quit to Title",()=>t.quitToTitle())),i.append(r),e.append(i),this.push(e,()=>t.resume())}showWardstone(t){this.hideAll();const e=this.game,i=this.div("menu dim"),n=this.div("panel");n.style.minWidth="360px",n.innerHTML='<h2>Wardstone</h2><div class="sub">The stone hums. Your progress is safe here.</div>';const s=this.div("menu-list");s.append(this.btn("Abilities",()=>this.showUpgrades()),this.btn("Journal",()=>this.showJournal())),e.level?.def.id!=="sanctum"&&e.save.unlocked.includes("sanctum")&&s.append(this.btn("Travel to the Sanctum",()=>{this.hideAll(),e.travel("sanctum")})),s.append(this.btn("Leave",()=>e.resume())),n.append(s),i.append(n),this.push(i,()=>e.resume())}showTravel(){const t=this.game;this.hideAll(),t.state="pause",t.input.wantPointerLock=!1,t.input.releaseLock();const e=this.div("menu dim"),i=this.div("panel",'<h2>The Wardgate</h2><div class="sub">Choose a realm. Realms you have finished can be revisited for secrets you could not reach before.</div>'),n=this.div("levels");for(const r of["fen","falls","frostworks","plains","keep"]){const o=no[r],h=t.save.unlocked.includes(r),l=document.createElement("button");l.className=`lvl${t.save.levelsDone[r]?" done":""}`,l.dataset.f="1",l.disabled=!h;const c=Object.keys(t.save.found).filter(u=>u.startsWith(`${r}:`)).length;l.innerHTML=`<h3>${h?o.name:"???"}</h3><p>${h?o.blurb:"Sealed."}</p><p style="margin-top:6px">${h?`Collectibles found: ${c}/${o.collectibles}`:""}</p>`,l.addEventListener("click",()=>{h&&(t.audio.play("uiConfirm"),this.hideAll(),t.input.wantPointerLock=!0,t.input.requestLock(),t.travel(r))}),n.append(l)}i.append(n);const s=this.btn("Stay",()=>t.resume());s.style.marginTop="16px",i.append(s),e.append(i),this.push(e,()=>t.resume(),2)}showUpgrades(){const t=this.buildUpgrades();this.push(t,()=>this.pop(),2)}buildUpgrades(){const t=this.game,e=this.div("menu dim"),i=this.div("panel");i.innerHTML="<h2>Abilities</h2>";const n=this.div("bank",`<i class="gem-icon"></i><span>${t.save.gems}</span> <small style="font:13px system-ui;color:#a99cc9">spirit gems to spend</small>`);i.append(n);const s=this.div("tabs"),r=["horn","tail","wings","spirit",...jo];for(const l of r){const c=document.createElement("button"),u=jo.includes(l)&&!t.save.elements.includes(l);c.className=`tab${l===this.tree?" on":""}${u?" locked":""}`,c.textContent=u?`${ao[l]} (sealed)`:ao[l],c.addEventListener("click",()=>{this.tree=l,t.audio.play("ui"),this.rebuildUpgrades()}),s.append(c)}i.append(s);const o=this.div("cards");for(const l of Qa.filter(c=>c.tree===this.tree)){const c=li(t.save,l.id),u=Td(t.save,l.id),d=l.element&&!t.save.elements.includes(l.element),f=this.div("card"),m=l.costs.map((g,y)=>`<i class="${y<c?"on":""}"></i>`).join(""),v=d?`Learn ${ao[l.tree]} from its Warden to unlock.`:c>=l.costs.length?l.desc[l.desc.length-1]:l.desc[c];f.innerHTML=`<h3>${l.name}</h3><div class="pips">${m}</div><p>${v}</p>`;const p=this.div("row");if(d)p.append(this.div("cost no","Sealed"));else if(u===null)p.append(this.div("cost","Mastered"));else{const g=t.save.gems>=u;p.append(this.div(`cost${g?"":" no"}`,`<i class="gem-icon" style="width:12px;height:16px"></i>${u}`));const y=this.btn(c===0?"Learn":"Upgrade",()=>{Px(t.save,l.id)&&(t.audio.play("levelUp"),Pi(t.save),this.rebuildUpgrades())},!g,"btn small");p.append(y)}f.append(p),o.append(f)}i.append(o);const h=this.btn("Back",()=>this.pop());return h.style.marginTop="16px",i.append(h),e.append(i),e}rebuildUpgrades(){const t=this.stack[this.stack.length-1];if(!t)return;const e=t.idx,i=this.buildUpgrades();t.el.replaceWith(i),t.el=i,this.refreshFocus(t),t.idx=Math.min(e,t.focus.length-1),t.focus.forEach((n,s)=>n.classList.toggle("focus",s===t.idx))}showMoves(){const t=this.game,e=this.div("menu dim"),i=this.div("panel",'<h2>Moves</h2><div class="sub">Gamepad: A jump &middot; X horn &middot; Y tail &middot; B dodge &middot; RT breath &middot; LB burst &middot; LT dragon time &middot; RB lock &middot; D-pad elements &middot; Back fury</div>'),n=this.div("moves");for(const r of fy){const o=r.requires&&li(t.save,r.requires)===0||r.element&&t.save.elements.length===0;n.append(this.div(`move${o?" locked":""}`,`<b>${r.name}</b><span class="in">${r.input}</span><p>${o?r.requires?"Unlock in Abilities.":"Learn an element first.":r.desc}</p>`))}i.append(n);const s=this.btn("Back",()=>this.pop());s.style.marginTop="16px",i.append(s),e.append(i),this.push(e,()=>this.pop())}showJournal(){const t=this.game,e=this.div("menu dim"),i=this.div("panel lore");i.innerHTML='<h2>Journal</h2><div class="sub">Dragon Relics and field notes.</div>';for(const[r,o]of py)i.append(this.div("entry",`<h4>${r}</h4><p>${o}</p>`));const n=new Set(Object.keys(t.save.found));for(const[r,o]of Object.entries(Bd)){const h=[...n].some(l=>l.endsWith(`:${r}`)||l===r||l.endsWith(r));i.append(this.div(`entry${h?"":" missing"}`,h?`<h4>${o.title}</h4><p>${o.text}</p>`:`<h4>Undiscovered relic</h4><p style="font-style:normal;color:#a99cc9">Somewhere in ${no[o.level]?.name??"the realms"}.</p>`))}const s=this.btn("Back",()=>this.pop());s.style.marginTop="16px",i.append(s),e.append(i),this.push(e,()=>this.pop())}showOptions(){const t=this.game,e=t.options,i=this.div("menu dim"),n=this.div("panel");n.innerHTML="<h2>Options</h2>";const s=this.div("opts"),r=(l,c,u,d=0,f=1,m=.05)=>{const v=document.createElement("label");v.textContent=l;const p=document.createElement("input");p.type="range",p.min=String(d),p.max=String(f),p.step=String(m),p.value=String(c()),p.addEventListener("input",()=>{u(Number(p.value)),t.applyOptions()}),s.append(v,p)},o=(l,c,u,d)=>{const f=document.createElement("label");f.textContent=l;const m=this.div("seg-ctl"),v=()=>{m.innerHTML="";for(const[p,g]of c){const y=this.btn(g,()=>{d(p),t.applyOptions(),v(),this.refreshFocus(this.stack[this.stack.length-1])},!1,`btn small${u()===p?" focus":""}`);u()===p&&(y.style.borderColor="#f5c46b"),m.append(y)}};v(),s.append(f,m)};r("Master volume",()=>e.volume,l=>e.volume=l),r("Music",()=>e.music,l=>e.music=l),r("Sound effects",()=>e.sfx,l=>e.sfx=l),r("Camera sensitivity",()=>e.sensitivity,l=>e.sensitivity=l,.2,2.5,.05),r("Screen shake",()=>e.shake,l=>e.shake=l,0,1.5,.05),o("Invert camera Y",[[!1,"Off"],[!0,"On"]],()=>e.invertY,l=>e.invertY=l),o("Auto camera",[[!0,"On"],[!1,"Off"]],()=>e.autoCamera,l=>e.autoCamera=l),o("Damage numbers",[[!0,"On"],[!1,"Off"]],()=>e.damageNumbers,l=>e.damageNumbers=l),o("Graphics",[["low","Low"],["medium","Medium"],["high","High"]],()=>e.quality,l=>e.quality=l),t.state!=="title"&&o("Difficulty",[["story","Story"],["normal","Adventurer"],["hard","Legend"]],()=>t.save.difficulty,l=>{t.save.difficulty=l,Pi(t.save)}),n.append(s);const h=this.btn("Back",()=>this.pop());h.style.marginTop="18px",n.append(h),i.append(n),this.push(i,()=>this.pop())}showControls(){const t=this.div("menu dim"),e=[["Move","W A S D","Left stick"],["Camera","Mouse","Right stick"],["Jump / flap / glide","Space (hold to glide)","A"],["Horn attack","Left mouse / J","X"],["Tail attack","E / L","Y"],["Breath","Hold right mouse / K","RT"],["Burst","Q / U","LB"],["Fury","X","Back"],["Dodge / hold to charge","Shift","B"],["Dragon Time","Hold C","LT"],["Lock on","Tab / middle mouse","RB"],["Change element","1-4, mouse wheel, R","D-pad"],["Interact","F","L3"],["Pause","Esc","Start"]],i=this.div("panel",`<h2>Controls</h2><div class="stats" style="grid-template-columns:auto auto auto;gap:8px 28px">
      <b style="text-align:left;color:#f5c46b">Action</b><b style="text-align:left;color:#f5c46b">Keyboard &amp; mouse</b><b style="text-align:left;color:#f5c46b">Gamepad</b>
      ${e.map(([n,s,r])=>`<span>${n}</span><b style="text-align:left">${s}</b><b style="text-align:left">${r}</b>`).join("")}</div>
      <div class="sub">Click the game to capture the mouse. Esc releases it.</div>`);i.append(this.btn("Back",()=>this.pop())),t.append(i),this.push(t,()=>this.pop())}showEnding(t){const e=this.game;this.hideAll(),e.state="ending",e.input.wantPointerLock=!1,e.input.releaseLock();const i=this.div("menu dim");i.style.background="rgba(4,2,10,.8)";const n=this.div("crawl");t.forEach((h,l)=>{const c=document.createElement("p");c.innerHTML=h,c.style.animationDelay=`${l*2.4}s`,n.append(c)});const s=e.save.stats,r=this.div("stats",`<span>Enemies defeated</span><b>${s.kills}</b><span>Best combo</span><b>${s.bestCombo}</b>
      <span>Elemental reactions</span><b>${s.reactions}</b><span>Collectibles</span><b>${Object.keys(e.save.found).filter(h=>!h.startsWith("story")&&!h.startsWith("arena")).length}</b>`);r.style.opacity="0",r.style.animation=`crawlIn 1s ${t.length*2.4}s forwards`,r.style.justifyContent="center",n.append(r);const o=this.btn("Return to the Sanctum",()=>{this.hideAll(),e.state="play",e.travel("sanctum")});o.style.opacity="0",o.style.animation=`crawlIn 1s ${t.length*2.4+.5}s forwards`,n.append(o),i.append(n),this.push(i,null)}}class gy{constructor(t,e){this.game=t;const i=document.createElement("div");i.className="ui-layer",this.topBar=document.createElement("div"),this.topBar.className="letterbox top",this.botBar=document.createElement("div"),this.botBar.className="letterbox bot",this.box=document.createElement("div"),this.box.className="dialogue",this.box.style.display="none",this.box.innerHTML='<div class="dlg-box"><div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-next">Space / Click &#9656; &nbsp; Esc to skip</div></div>',this.nameEl=this.box.querySelector(".dlg-name"),this.textEl=this.box.querySelector(".dlg-text"),i.append(this.topBar,this.botBar,this.box),e.appendChild(i),this.box.addEventListener("pointerdown",()=>this.advance())}game;box;nameEl;textEl;topBar;botBar;lines=[];idx=0;shown=0;full="";done=null;active=!1;talkT=0;get isActive(){return this.active}start(t,e){this.lines=t,this.idx=-1,this.done=e,this.active=!0,this.box.style.display="block",this.topBar.classList.add("on"),this.botBar.classList.add("on"),this.next()}next(){if(this.idx++,this.idx>=this.lines.length){this.finish();return}const t=this.lines[this.idx],e=V1[t.who]??{name:t.who,color:"#ffffff"};this.nameEl.textContent=e.name,this.nameEl.style.color=e.color,this.full=t.text,this.shown=0,this.textEl.textContent="",this.game.dialogueSpeaker=t.who,t.action?.(),this.frame(t)}frame(t){const e=this.game;if(t.shot==="none"){e.cam.clearShot();return}const i=new C(e.player.x,e.player.y+1.1,e.player.z),n=this.speakerPos(t.who)??this.lastOther??i.clone().add(new C(Math.sin(e.player.yaw)*3,.5,Math.cos(e.player.yaw)*3));t.who!=="aster"&&t.who!=="flick"&&this.speakerPos(t.who)&&(this.lastOther=n.clone());const s=t.who==="aster"||t.who==="flick"?i:n,r=i.clone().lerp(n,.5),o=n.clone().sub(i);o.y=0;const h=Math.max(1,o.length());o.normalize();const l=new C(-o.z,0,o.x),c=t.shot==="wide",u=c?h+9:h*.8+4.5,d=r.clone().addScaledVector(l,u).addScaledVector(o,t.who==="aster"?h*.35:-h*.35);d.y+=c?4:1.2;const f=e.col.terrainAt(d.x,d.z);f>-1e3&&d.y<f+1&&(d.y=f+1);const m=s.clone().lerp(r,.4);e.cam.setShot(d,m)}lastOther=null;speakerPos(t){const e=this.game;if(t==="aster")return new C(e.player.x,e.player.y+1.1,e.player.z);if(t==="flick")return e.flick.position.clone();const i=e.level?.npcs.find(n=>n.id===t);return i?new C(i.x,i.y+1.4*i.rig.look.scale,i.z):e.boss&&e.boss.speakerId===t?new C(e.boss.x,e.boss.y+e.boss.height*.7,e.boss.z):null}advance(){if(this.active){if(this.shown<this.full.length){this.shown=this.full.length,this.textEl.textContent=this.full;return}this.game.audio.play("ui",1.1,.6),this.next()}}finish(){this.active=!1,this.box.style.display="none",this.topBar.classList.remove("on"),this.botBar.classList.remove("on"),this.lastOther=null;const t=this.done;this.done=null,t?.()}update(t){if(!this.active)return;const e=this.game.input;if(this.shown<this.full.length&&(this.shown=Math.min(this.full.length,this.shown+t*55),this.textEl.textContent=this.full.slice(0,Math.floor(this.shown)),this.talkT-=t,this.talkT<=0&&(this.talkT=.07,this.game.audio.play("talk"))),(e.take("confirm",.2)||e.take("horn",.2)||e.take("interact",.2))&&this.advance(),e.take("back",.2)){for(let i=this.idx+1;i<this.lines.length;i++)this.lines[i].action?.();this.finish()}}}class vy{constructor(t){this.game=t;const e=new J(new wi(.09,10,8),te(3811856));e.scale.set(1,1,1.6),this.root.add(e);const i=new J(new wi(.1,12,10),te(14207072));i.position.z=-.16,this.root.add(i);const n=new J(new wi(.22,12,10),te(16769120,.14,!0));n.position.z=-.16,this.root.add(n);const s=new si({color:15267071,transparent:!0,opacity:.55,side:we,depthWrite:!1});for(const r of[-1,1]){const o=new J(new ys(.16,10),s);o.scale.set(1,.45,1),o.position.set(r*.12,.06,0),o.rotation.x=-Math.PI/2,this.root.add(o),this.wings.push(o)}t.scene.add(this.root)}game;root=new kt;position=new C;wings=[];t=0;sparkT=0;titleAngle=0;reset(){const t=this.game.player;this.position.set(t.x+.8,t.y+1.8,t.z),this.root.visible=!0}update(t){const e=this.game.player;this.t+=t;const i=Math.sin(this.t*.4)*.3+.9,n=e.x+Math.cos(e.yaw)*i-Math.sin(e.yaw)*.6,s=e.z-Math.sin(e.yaw)*i-Math.cos(e.yaw)*.6,r=e.y+1.9+Math.sin(this.t*2.6)*.18;this.position.x=Ft(this.position.x,n,4,t),this.position.y=Ft(this.position.y,r,4,t),this.position.z=Ft(this.position.z,s,4,t),this.pose(t,e.yaw),this.root.visible=!e.hidden}updateTitle(t){this.t+=t,this.titleAngle+=t*.5,this.position.set(Math.sin(this.titleAngle)*5,4+Math.sin(this.t*1.3)*.8,10+Math.cos(this.titleAngle)*5),this.pose(t,this.titleAngle+Math.PI/2)}pose(t,e){this.root.position.copy(this.position),this.root.rotation.y=e;for(const i of this.wings)i.rotation.y=Math.sin(this.t*60)*.6*Math.sign(i.position.x);this.sparkT-=t,this.sparkT<=0&&(this.sparkT=.12,this.game.fx.emit(this.position.x,this.position.y,this.position.z,{count:1,speed:.3,life:[.5,.9],size:[.08,.14],sizeEnd:0,color:16773248,bright:2,gravity:.3}))}}class xy{constructor(t){this.game=t}game;melee=new Set;ranged=new Set;request(t,e){const i=this.game.save.difficulty,n=i==="story"?1:i==="normal"?2:3,s=i==="story"?1:2,r=e?this.ranged:this.melee;return r.has(t)?!0:r.size>=(e?s:n)?!1:(r.add(t),!0)}release(t){this.melee.delete(t),this.ranged.delete(t)}clear(){this.melee.clear(),this.ranged.clear()}}class yy{renderer;scene;camera;input;audio=ux;fx;cam=new Mx;hud;menus;dialogue;save;options;player;flick;level=null;enemies=[];projectiles=[];shockwaves=[];gems=[];director;style=new kh;state="title";time=0;realTime=0;stats={damageTaken:0};pendingSpawns=[];dialogueSpeaker=null;boss=null;hitstopT=0;slowScale=1;slowT=0;hitList=[];deadT=0;combatHold=0;gemChain=0;gemChainT=0;firePatches=[];spikes=[];transitionFn=null;transitionT=0;transitionPhase="out";stateBeforeTransition="play";interactTarget=null;autosaveT=0;activeArena=null;titleT=0;sessionFlags=new Set;constructor(t){this.renderer=new hx(t),this.scene=this.renderer.scene,this.camera=this.renderer.camera,this.input=new lx(this.renderer.canvas),this.fx=new vx(this.camera),this.scene.add(this.fx.root),this.options=Ix(),this.save=tr()??ja(),this.director=new xy(this),this.player=new $x(this),this.flick=new vy(this),this.hud=new uy(this,t),this.dialogue=new gy(this,t),this.menus=new my(this,t),this.applyOptions(),window.addEventListener("resize",()=>this.fx.setViewport(this.renderer.height,this.camera.fov)),this.fx.setViewport(this.renderer.height,this.camera.fov);const e=()=>this.audio.unlock();window.addEventListener("pointerdown",e),window.addEventListener("keydown",e)}get col(){return this.level.col}get waterLevel(){return this.level?this.level.waterLevel:-1e4}get killY(){return this.level?this.level.killY:-50}get difficultyInfo(){return Sd[this.save.difficulty]}applyOptions(){const t=this.options;this.audio.volume=t.volume,this.audio.musicVolume=t.music,this.audio.sfxVolume=t.sfx,this.audio.applyVolumes(),this.input.mouseSensitivity=t.sensitivity,this.input.invertY=t.invertY,this.renderer.quality!==t.quality&&this.renderer.setQuality(t.quality),this.fx.density=t.quality==="low"?.5:t.quality==="medium"?.8:1,Nx(t)}showTitle(){this.state="title",this.input.wantPointerLock=!1,this.input.releaseLock(),this.loadLevel("fen",{title:!0}),this.menus.showTitle(),this.audio.setMusic(zs.title)}newGame(t){this.save=ja(t),Pi(this.save),this.player.element=null,this.startPlaying(this.save.level,null)}continueGame(){const t=tr();t&&(this.save=t,this.player.element=t.elements[0]??null,this.startPlaying(t.level,t.checkpoint))}startPlaying(t,e){this.menus.hideAll(),this.fadeTo(()=>{this.input.wantPointerLock=!0,this.input.requestLock(),this.loadLevel(t,{checkpoint:e})})}fadeTo(t){this.state!=="transition"&&(this.stateBeforeTransition=this.state),this.transitionFn=t,this.transitionT=0,this.transitionPhase="out",this.state="transition"}travel(t){this.audio.play("uiConfirm"),this.fadeTo(()=>{this.save.level=t,this.save.checkpoint=null,this.save.unlocked.includes(t)||this.save.unlocked.push(t),Pi(this.save),this.loadLevel(t,{checkpoint:null})})}loadLevel(t,e={}){const i=cy[t];if(!i)throw new Error(`no level ${t}`);this.clearLevel();const n=new N1(i);this.level=n,this.scene.add(n.root),this.renderer.applySky(i.sky);const s=new U1(this,n);i.terrain&&s.terrain(i.terrain),i.water&&s.water(i.water),i.build(s),s.finish();for(const u of this.pendingSpawns)this.spawnEnemy(u.type,u.x,u.y,u.z,u.yaw,!1);this.pendingSpawns=[];let[r,o,h]=i.spawn;const l=e.checkpoint?n.wardstones.get(e.checkpoint):void 0;l&&(r=l.x+Math.sin(l.yaw)*2.5,o=l.z+Math.cos(l.yaw)*2.5,h=l.yaw);const c=n.col.groundAt(r,o,1e4,.2).y;if(this.player.place(r,(c>-1e3?c:0)+.1,o,h),this.player.resetForLevel(),this.player.hidden=!!e.title,this.flick.reset(),this.cam.snapBehind(h,.32),this.cam.extraDist=0,this.time=0,this.style.reset(),this.audio.stopAllLoops(),e.title)this.hud.show(!1);else{this.state="play",this.audio.setMusic(zs[i.music]??zs.fen),this.hud.show(!0),this.hud.levelTitle(i.name,i.subtitle);const u=!this.sessionFlags.has(`entered:${t}`);this.sessionFlags.add(`entered:${t}`),i.onEnter?.(this,u)}}clearLevel(){for(const t of this.enemies)t.dispose();for(const t of this.projectiles)t.kill();for(const t of this.shockwaves)t.kill();for(const t of this.gems)t.kill();for(const t of this.spikes)for(const e of t.meshes)this.scene.remove(e);this.enemies=[],this.projectiles=[],this.shockwaves=[],this.gems=[],this.firePatches=[],this.spikes=[],this.boss=null,this.activeArena=null,this.director.clear(),this.fx.clear(),this.hud.bossBar(null),this.cam.clearShot(),this.level&&this.level.dispose(this.scene),this.level=null}maxDt=.05;frame(t){const e=Math.min(t,this.maxDt);switch(this.realTime+=e,this.input.update(e),this.state){case"title":case"menu":this.menus.update(e),this.titleCamera(e);break;case"pause":this.menus.update(e);break;case"play":if(this.input.take("pause",.2)){this.pause();break}this.updateInteract(),this.simulate(e);break;case"dialogue":this.dialogue.update(e),this.simulate(e);break;case"dead":this.simulate(e),this.deadT+=e,this.deadT>2.6&&this.respawnAtCheckpoint();break;case"ending":this.menus.update(e),this.simulate(e);break;case"transition":this.updateTransition(e),this.stateBeforeTransition!=="title"&&this.level&&!this.player.hidden&&this.simulate(e*.2);break}this.state!=="title"&&this.state!=="menu"&&this.level&&this.cam.update(e,this),this.hud.update(e),this.renderer.follow(this.player.body.y>-1e3?new C(this.player.x,this.player.y,this.player.z):new C),this.level?.water&&this.level.water.update(this.realTime,this.camera.position.x,this.camera.position.z),this.renderer.render(this.realTime)}titleCamera(t){this.titleT+=t;const e=this.titleT*.05,i=Math.sin(e)*26,n=Math.cos(e)*26+10;this.camera.position.set(i,9+Math.sin(this.titleT*.2)*1.5,n),this.camera.lookAt(0,3,10),this.fx.update(t),this.level&&(this.level.update(t),this.flick.updateTitle(t))}updateTransition(t){if(this.transitionT+=t,this.transitionPhase==="out"){if(this.hud.fade(Math.min(1,this.transitionT/.45)),this.transitionT>=.45){const e=this.transitionFn;this.transitionFn=null,this.transitionPhase="in",this.transitionT=0,this.state=this.stateBeforeTransition,e?.(),this.stateBeforeTransition=this.state,this.state="transition"}}else this.hud.fade(1-Math.min(1,this.transitionT/.5)),this.transitionT>=.5&&(this.hud.fade(0),this.state=this.stateBeforeTransition)}pause(){this.state="pause",this.input.wantPointerLock=!1,this.input.releaseLock(),this.audio.stopAllLoops(),this.player.breath.stop(),this.menus.showPause(),this.audio.play("uiBack")}resume(){this.menus.hideAll(),this.state="play",this.input.wantPointerLock=!0,this.input.requestLock(),this.input.clearBuffers()}quitToTitle(){Pi(this.save),this.menus.hideAll(),this.fadeTo(()=>this.showTitle())}simulate(t){const e=this.level;if(!e)return;if(this.hitstopT>0){this.hitstopT-=t,this.fx.update(t*.25);return}this.slowT=Math.max(0,this.slowT-t);let i=this.slowT>0?this.slowScale:1;const n=this.player.dragonTimeActive;n&&(i=Math.min(i,.33));const s=n?.8:1;this.hud.dragonTime(n);const r=t*i,o=t*s;this.time+=r,this.save.stats.playTime+=t;const h=Math.max(1,Math.ceil(Math.max(r,o)/(1/60)));for(let d=0;d<h;d++){this.rebuildHitList(),e.update(r/h),this.player.update(o/h);for(const f of this.enemies)f.update(r/h);for(const f of this.projectiles)f.alive&&f.update(r/h);for(const f of this.shockwaves)f.alive&&f.update(r/h);this.boss?.updateBoss(r/h)}for(const d of this.gems)d.alive&&d.update(o);this.updatePatches(r),this.updateSpikes(r),this.flick.update(t),this.fx.update(r);const l=this.enemies.filter(d=>d.removable);for(const d of l)d.dispose();l.length&&(this.enemies=this.enemies.filter(d=>!d.removable)),this.projectiles.some(d=>!d.alive)&&(this.projectiles=this.projectiles.filter(d=>d.alive)),this.shockwaves.some(d=>!d.alive)&&(this.shockwaves=this.shockwaves.filter(d=>d.alive)),this.gems.length>20&&this.gems.some(d=>!d.alive)&&(this.gems=this.gems.filter(d=>d.alive));for(const d of this.pendingSpawns)this.spawnEnemy(d.type,d.x,d.y,d.z,d.yaw,!1);this.pendingSpawns=[],this.enemies.some(d=>d.alive&&d.aggro&&Math.hypot(d.x-this.player.x,d.z-this.player.z)<28)||this.activeArena||this.boss?this.combatHold=3:this.combatHold=Math.max(0,this.combatHold-t);const u=this.combatHold>0?1:0;if(u!==this.audio.combatLevel&&this.audio.setCombat(u),this.style.update(t,this.combatHold>0),this.style.bestCombo>this.save.stats.bestCombo&&(this.save.stats.bestCombo=this.style.bestCombo),this.gemChainT-=t,this.gemChainT<=0&&(this.gemChain=0),this.player.gliding){this.audio.startLoopOnce("glide","wind");const d=Math.hypot(this.player.body.vx,this.player.body.vz);this.audio.tuneLoop("glide",400+d*60,.1+d*.01)}else this.audio.stopLoop("glide");this.autosaveT+=t,this.autosaveT>30&&(this.autosaveT=0,Pi(this.save))}rebuildHitList(){const t=this.hitList;t.length=0;for(const e of this.enemies)e.alive&&t.push(e);if(this.level)for(const e of this.level.hittables)e.alive&&t.push(e)}hittables(){return this.hitList}updateInteract(){const t=this.level;if(!t||!this.player.alive)return;const e=this.player.body;let i=null,n=1/0;for(const s of t.interactables){if(!s.enabled)continue;const r=Math.hypot(s.x-e.x,s.z-e.z);r<s.range&&Math.abs(s.y-e.y)<3&&r<n&&(n=r,i=s)}this.interactTarget=i,this.hud.prompt(i?i.label:null),i&&this.input.take("interact",.2)&&i.interact()}hitstop(t){this.hitstopT=Math.max(this.hitstopT,Math.min(t,.14))}slowmo(t,e){(this.slowT<=0||t<this.slowScale)&&(this.slowScale=t),this.slowT=Math.max(this.slowT,e)}shake(t,e=.2){this.cam.shake(t,e)}toast(t,e="info"){this.hud.toast(t,e)}sfx(t,e,i,n,s=1,r=1){let o=r;if(e!==void 0&&n!==void 0){const h=Math.hypot(e-this.player.x,(i??this.player.y)-this.player.y,n-this.player.z);if(o*=Math.max(.08,Math.min(1,1.25-h/32)),h>60)return}this.audio.play(t,s,o)}spawnEnemy(t,e,i,n,s,r){const o=Dd[t];if(!o)throw new Error(`unknown enemy ${t}`);const h=new Ld(this,o,e,i,n,s);return r||(h.state="idle",h.model.root.visible=!0),this.enemies.push(h),h}addBoss(t){this.boss=t,this.enemies.push(t),this.hud.bossBar(t)}spawnProjectile(t){const e=new r1(this,t);return this.projectiles.push(e),e}spawnShockwave(t,e,i,n,s,r,o,h){this.shockwaves.push(new o1(this,t,e,i,n,s,r,o))}spawnGems(t,e,i,n,s){for(const r of["blue","red","green","purple"]){const o=n[r]??0;if(!(o<=0))for(const h of l1(o))this.gems.push(new mc(this,r,h,t,e,i,5,s))}}placeGem(t,e,i,n,s){const r=new mc(this,t,e,i,n,s,0,!1);r.vy=0,r.age=1,this.gems.push(r)}nearestEnemy(t,e,i,n){let s=null,r=n;for(const o of this.enemies){if(!o.alive)continue;const h=Math.hypot(o.x-t,o.y-e,o.z-i);h<r&&(r=h,s=o)}return s}isWarded(t){if(t.def.id==="totem")return!1;for(const e of this.enemies)if(e.alive&&e.def.id==="totem"&&Math.hypot(e.x-t.x,e.z-t.z)<s1)return!0;return!1}onEnemyDamaged(t,e,i,n){if(this.options.damageNumbers&&e>=.5){const s=i?_y(i.type):16751184;this.hud.number(t.x,t.y+t.height+.2,t.z,Math.round(e),s,n!==null||(i?.heavy??!1))}}onEnemyKilled(t,e){this.save.stats.kills++;const i=this.style.reward*(e==="shatter"?1.5:1),n=t.def.gems;this.spawnGems(t.x,t.y+t.height*.5,t.z,{blue:Math.round(n.blue*i),red:n.red??0,green:n.green??0,purple:n.purple??0},!0),this.style.bonus(15*(t.def.styleValue??1)),this.player.gainFury(5),this.player.lock===t&&(this.player.lock=null)}triggerReaction(t,e){const i=kd[e],n=t.x,s=t.y+t.height*.5,r=t.z;if(this.save.stats.reactions++,this.style.bonus(90),this.hud.bigText(i.name,i.color),this.player.gainFury(10),e==="shatter")this.fx.shatter(n,s,r),this.sfx("shatter",n,s,r),this.slowmo(.3,.25),this.shake(.3,.2);else if(e==="overload"){this.fx.explosion(n,s,r,2.2,16765802,8405247);for(let o=0;o<6;o++){const h=new C(n,s,r),l=new C(n+nt.signed()*4,s+nt.signed()*2,r+nt.signed()*4);this.fx.arc(h,l,16771232,.1,.2,.4)}this.sfx("explosion",n,s,r,1.2),this.shake(.4,.3),this.aoe(n,s,r,i.radius,i.damage,"lightning",t,{knockback:8,launch:5,buildup:30,stagger:40})}else this.fx.emit(n,s,r,{count:40,speed:6,life:[.6,1.1],size:[.8,1.4],sizeEnd:3,color:16054527,alpha:.6,additive:!1,drag:3,gravity:-2}),this.sfx("steam",n,s,r),this.aoe(n,s,r,i.radius,i.damage,"physical",t,{knockback:4,launch:0,buildup:0,stagger:60,steam:!0})}aoe(t,e,i,n,s,r,o,h){for(const l of[...this.enemies]){if(!l.alive||l===o)continue;const c=l.x-t,u=l.z-i,d=Math.hypot(c,u);if(d>n+l.radius||Math.abs(l.y-e)>3)continue;h.steam&&(l.status.steam=1.8);const f=d||1;l.takeHit(ze({damage:s,type:r,dirX:c/f,dirZ:u/f,knockback:h.knockback,launch:h.launch,buildup:h.buildup,stagger:h.stagger,source:"reaction",move:"reaction",ox:t,oz:i}))}}explode(t,e,i,n,s,r,o,h){const l=r==="fire"?16752704:r==="earth"?13150328:r==="lightning"?12577023:r==="ice"?13629183:h.color;if(r==="earth"?(this.fx.rocks(t,e,i,18),this.fx.ring(t,e-.3,i,.3,n*1.3,14207136,.4),this.sfx("pound",t,e,i)):(this.fx.explosion(t,e,i,n*.6,l),this.sfx("explosion",t,e,i,r==="lightning"?1.4:1,.8)),this.shake(.3*Math.min(1.5,n/3),.25),o){for(const c of this.hittables()){if(!c.alive)continue;const u=c.x-t,d=c.z-i,f=Math.hypot(u,d,(c.y+c.height*.5-e)*.7);if(f>n+c.radius)continue;const m=1-Math.min(1,f/(n+c.radius))*.5,v=Math.hypot(u,d)||1,p=c.takeHit(ze({damage:s*m,type:r,buildup:h.buildup,dirX:u/v,dirZ:d/v,knockback:h.knockback,launch:h.launch,stagger:h.stagger,heavy:h.heavy,source:"burst",move:h.move,ox:t,oz:i,hitstop:.03}));this.player.onDealt(p,c,s*m,h.move,12)}h.burnGround&&this.firePatches.push({x:t,y:e,z:i,r:n*.8,t:3,tick:0})}else{const c=this.player;if(Math.hypot(c.x-t,c.y+.6-e,c.z-i)<n+c.body.radius){const d=Math.hypot(c.x-t,c.z-i)||1;c.takeHit(ze({damage:s*this.difficultyInfo.enemyDamage,type:r,dirX:(c.x-t)/d,dirZ:(c.z-i)/d,knockback:h.knockback,launch:6,source:"enemy",fromPlayer:!1,ox:t,oz:i}),null)}}}updatePatches(t){for(const e of this.firePatches){if(e.t-=t,e.tick-=t,nt.chance(.6)){const i=nt.next()*Math.PI*2,n=Math.sqrt(nt.next())*e.r;this.fx.emit(e.x+Math.sin(i)*n,e.y,e.z+Math.cos(i)*n,{count:1,speed:1.5,dir:[0,1.5,0],life:[.3,.6],size:[.4,.7],sizeEnd:.1,color:16756800,colorEnd:16719872,bright:1.6,gravity:-2})}if(e.tick<=0){e.tick=.5;for(const i of this.enemies)!i.alive||Math.hypot(i.x-e.x,i.z-e.z)>e.r+i.radius||Math.abs(i.y-e.y)>1.5||i.takeHit(ze({damage:4,type:"fire",buildup:30,source:"burst",move:"firePatch",ox:e.x,oz:e.z}))}}this.firePatches.some(e=>e.t<=0)&&(this.firePatches=this.firePatches.filter(e=>e.t>0))}spawnIceSpikes(t,e,i,n){const s=new Ki({color:13629183,roughness:.1,emissive:3842256,emissiveIntensity:.4,flatShading:!0,transparent:!0}),r=[],o=16;for(let h=0;h<o;h++){const l=h/o*Math.PI*2,c=n*(.55+nt.next()*.4),u=new J(new cn(.35,2.2,5),s);u.position.set(t+Math.sin(l)*c,e-1,i+Math.cos(l)*c),u.rotation.set(Math.cos(l)*.35,0,-Math.sin(l)*.35),this.scene.add(u),r.push(u)}this.spikes.push({meshes:r,t:0});for(const h of this.enemies)!h.alive||Math.hypot(h.x-t,h.z-i)>n+h.radius||h.takeHit(ze({damage:10,type:"ice",buildup:30,launch:6,stagger:30,source:"burst",move:"iceSpikes",ox:t,oz:i}))}updateSpikes(t){for(const e of this.spikes){e.t+=t;const i=Math.min(1,e.t/.12);for(const n of e.meshes){n.position.y+=(i<1?9:0)*t;const s=n.material;e.t>1.2&&(s.opacity=Math.max(0,1-(e.t-1.2)*2))}if(e.t>1.8)for(const n of e.meshes)this.scene.remove(n)}this.spikes.some(e=>e.t>1.8)&&(this.spikes=this.spikes.filter(e=>e.t<=1.8))}onSlam(t,e,i,n){this.level?.slam(t,e,i,n)}isDeepWater(t,e,i){const n=this.waterLevel;return n>-1e3&&n>i+.9}inHazard(t,e,i){return!!this.level?.hazards.some(n=>n.contains(t,e,i))}updraftAt(t,e,i){let n=0;for(const s of this.level?.updrafts??[])s.contains(t,e,i)&&(n+=s.strength);return n}playerFell(){const t=this.player;t.state==="fall"||t.state==="dead"||(t.setState("fall"),t.breath.stop(),this.fadeTo(()=>{t.respawnAtSafe(),t.hp=Math.max(1,t.hp-8),this.toast("-8","warn"),this.cam.snapBehind(t.yaw)}))}onPlayerDied(){this.state="dead",this.deadT=0,this.save.stats.deaths++,this.hud.death(!0),this.audio.stopAllLoops()}respawnAtCheckpoint(){this.hud.death(!1),this.fadeTo(()=>{for(const r of this.level?.arenas??[])r.reset();if(this.activeArena&&this.arenaEnded(this.activeArena),this.boss&&this.boss.alive){const r=this.boss;r.alive=!1,r.releaseToken(),r.dispose(),this.enemies=this.enemies.filter(o=>o!==r),this.boss=null,this.hud.bossBar(null),this.audio.setMusic(zs[this.level.def.music]??null),this.level.emit("boss-reset")}const t=this.save.level===this.level.def.id&&this.save.checkpoint?this.level.wardstones.get(this.save.checkpoint):void 0;let e,i,n;t?(e=t.x+Math.sin(t.yaw)*2.5,i=t.z+Math.cos(t.yaw)*2.5,n=t.yaw):[e,i,n]=this.level.def.spawn;const s=this.col.groundAt(e,i,1e4,.2).y;this.player.place(e,s+.1,i,n),this.player.resetForLevel(),this.player.fury=0;for(const r of this.projectiles)r.kill();for(const r of this.enemies)r.alive&&(r.aggro=!1,r.releaseToken(),r.body.setPos(r.homeX,r.body.y,r.homeZ));this.cam.snapBehind(n),this.state="play"})}activateCheckpoint(t){this.save.checkpoint=t.id,this.save.level=this.level.def.id,this.player.heal(this.player.maxHp),this.player.mana=this.player.maxMana,Pi(this.save)}openWardstone(t){this.state="pause",this.input.wantPointerLock=!1,this.input.releaseLock(),this.audio.stopAllLoops(),this.menus.showWardstone(t)}collect(t){const e=this.save;e.found[t.id]=!0;const i=this.player;if(t.kind==="heart"){e.heartShards++;const n=e.heartShards%wn;this.sfx("shard"),n===0?(this.toast("Four Heart Shards! Maximum health increased.","good"),this.audio.play("levelUp"),i.hp=Ed(e)):this.toast(`Heart Shard (${n}/${wn})`,"good")}else if(t.kind==="mana"){e.manaShards++;const n=e.manaShards%wn;this.sfx("shard"),n===0?(this.toast("Four Spirit Shards! Maximum mana increased.","good"),this.audio.play("levelUp"),i.mana=Ad(e)):this.toast(`Spirit Shard (${n}/${wn})`,"good")}else{this.sfx("relic");const n=Bd[t.relicId];n&&this.hud.relic(n.title,n.text)}this.fx.motes(t.x,t.y+1,t.z,t.kind==="heart"?16738938:t.kind==="mana"?7008410:16773296,30),Pi(e)}collectGem(t,e,i,n,s){const r=this.player;this.gemChain++,this.gemChainT=.6;const o=1+Math.min(12,this.gemChain)*.045;switch(t){case"blue":this.save.gems+=e,this.hud.gemBump(),this.audio.play("gemBlue",o,.7);break;case"red":r.heal(8*e),this.audio.play("gemRed",o,.7);break;case"green":r.mana=Math.min(r.maxMana,r.mana+8*e),this.audio.play("gemGreen",o,.7);break;case"purple":r.gainFury(6*e),this.audio.play("gemPurple",o,.7);break}this.fx.sparkle(i,n,s,Hi[t],3)}arenaStarted(t){this.activeArena=t,this.cam.extraDist=1.5}arenaEnded(t){this.activeArena===t&&(this.activeArena=null),this.cam.extraDist=0,Pi(this.save)}say(t,e){this.player.breath.stop(),this.player.gliding=!1;const i=this.state==="dialogue"?"play":this.state;this.state="dialogue",this.player.setState("locked"),this.dialogue.start(t,()=>{this.dialogueSpeaker=null,this.cam.clearShot(),this.player.setState("move"),this.state=i==="dead"?"dead":"play",this.input.clearBuffers(),e?.()})}learnElement(t){kx(this.save,t),this.player.element=t,this.hud.elementChanged(t),Pi(this.save)}saveNow(){Pi(this.save)}}function _y(a){switch(a){case"fire":return 16752704;case"lightning":return 12577023;case"ice":return 10479871;case"earth":return 12116090;case"shadow":return 13660415;default:return 16774880}}const ea=new URLSearchParams(location.search),Rc=ea.get("seed");Rc&&gx(Number(Rc));const My=document.getElementById("game-root"),bn=new yy(My);window.wyrm=bn;const Cc=Number(ea.get("maxdt"));Cc>0&&(bn.maxDt=Cc);const za=ea.get("quality");(za==="low"||za==="medium"||za==="high")&&(bn.options.quality=za,bn.applyOptions());const Pc=ea.get("level");Pc?(bn.input.wantPointerLock=!0,bn.loadLevel(Pc,{checkpoint:ea.get("cp")})):bn.showTitle();document.getElementById("boot")?.classList.add("hidden");window.__bootTimer&&clearTimeout(window.__bootTimer);let kc=performance.now();function Od(a){const t=(a-kc)/1e3;kc=a;try{bn.frame(t)}catch(e){console.error(e)}requestAnimationFrame(Od)}requestAnimationFrame(Od);
