function $N(val){var elems=document.getElementsByName(val);for(var i=0;i<elems.length;i++)
if(elems[i].checked)
return $(elems[i]);return $(elems[0]);}
if(typeof(debug)=='string'&&debug=='on'){true_alert=alert;debug_alert=window.alert=function(msg){window.alert.invocations=window.alert.invocations+1||0;if(window.alert.invocations<10)
true_alert(msg);else if(!confirm(msg))
window.alert=null;}}
else
debug_alert=function(msg){}
document.fully_loaded=false;Event.observe(window,"load",function(){document.fully_loaded=true;});function ann_init(){if(!ann_init_setup())return;if(document.dom_loaded_time)return;document.dom_loaded_time=new Date();ann_init_elements();emphasize_location_hash();Event.observe(window,'scroll',emphasize_location_hash);}
function emphasize_location_hash()
{var a=arguments.callee.emphasized_element||null;var b=null;if(/^#(.+)/.match(document.location.hash))b=$(RegExp.$1)
if(a==b)return;if(a)a.removeClassName('location_hash');if(b)b.addClassName('location_hash');arguments.callee.emphasized_element=b;if(b)
{var pos=document.viewport.getScrollOffsets();window.scrollTo(pos[0],pos[1]-7);}}
function ann_init_setup()
{if($('DOM_end'))return true;if(!already_called(arguments.callee)){if(document.addEventListener)
document.addEventListener("DOMContentLoaded",ann_init,false);setTimeout(ann_init,1);Event.observe(window,'load',ann_init);}
return false;}
function already_called(callee){if(callee.done)return true;callee.done=true;return false;}
Element.addMethods({show:function(element,show){element=$(element);element.style.display='';if(show===false)element.style.display='none';return element;}});ann_ad={};function ann_init_elements(){var to_init=$$('[ann_init]');for(var i=0;i<to_init.length;i++)
ann_init_element(to_init[i]);}
function ann_init_element(elem){var initparam=elem.getAttribute('ann_init');try{eval(initparam.gsub(/\bthis\b/,'elem'));}
catch(e){debug_alert('ann_init failed for\n'+initparam+'\n\nmsg:\n'+e.message);}}
function register_event_handler(obj,eventname,fn){if(obj.addEventListener)
obj.addEventListener(eventname,fn,false);else
obj.attachEvent('on'+eventname,fn);}
function validateNumeric(e,fp){if(e.charCode>=48&&e.charCode<=57)return true;if(e.charCode==46&&fp)return true;if(e.charCode==0)return true;e.stop();return false;}
function realurl(link,url)
{var tracker=link.href;link.href=url;link.observe('mousedown',function(){link.href=tracker;});link.observe('click',function(){link.href=tracker;});link.observe('mouseout',function(){link.href=url;});}
function mlink(link){var list=link.childNodes;var span=list[list.length-1];link.removeChild(span);var n=span.childNodes.length;var name,host=span.childNodes[n-2].childNodes[0].nodeValue;if(n==3){name=list[0].nodeValue;link.appendChild(document.createTextNode('@'+host));}
else{name=span.childNodes[n-4].childNodes[0].nodeValue;}
if(link.tagName=="A")
link.href='mailto:'+name+'@'+host;else
link.innerHTML='<a href="mailto:'+name+'@'+host+'">'+name+'@'+host+'</a>';}
function post_with_confirmation(url,msg)
{if(typeof(url)=='object')url=url.href.replace('(js)','');if(msg==''||confirm(msg)){var f=document.createElement('form');document.body.appendChild(f);f.method='POST';f.action=url;f.submit();}}
var gallery_id=-1;function show_gallery(n,event){var img;if(window.gallery_page_refresh&&event){img=Event.extend(event).element();img.parentNode.href='?'+n;return;}
if($('gallery_pic'+n)){for(j=-1;j<=1;j++){if(img=$('gallery_img'+(n+j))){img.src=img.getAttribute('xsrc');}}
if(gallery_id>=0)$('gallery_pic'+gallery_id).hide();$('gallery_pic'+n).show();gallery_id=n;}}
function init_tri_state_checkboxes()
{var inputs=document.getElementsByTagName('input');for(i=0;i<inputs.length;i++){if(inputs[i].type=="checkbox"){var chk=$(inputs[i])
if(m=chk.id.match(/(tristate\d+)in/)){var img=$(document.createElement("img"));img.setStyle({border:'1px solid black',padding:'1px',width:'9px',height:'9px',margin:'0 2px -2px 0'});img.setAttribute('tristate',m[1]);chk.insert({before:img});Event.observe(img,'click',toggle_tri_state);display_tri_state(img);chk.hide();}}}}
function toggle_tri_state(event){var img=Event.element(event);var chk_in=$(img.getAttribute('tristate')+'in');var chk_ex=$(img.getAttribute('tristate')+'ex');if(!chk_in.checked&&!chk_ex.checked){chk_in.checked=true;chk_ex.checked=false;if(chk_in.value=="erotica")$('AO').checked=true;}
else if(chk_in.checked&&!chk_ex.checked){chk_in.checked=false;chk_ex.checked=true;}
else{chk_in.checked=false;chk_ex.checked=false;}
display_tri_state(img);}
function display_tri_state(img){var chk_in=$(img.getAttribute('tristate')+'in');var chk_ex=$(img.getAttribute('tristate')+'ex');if(chk_in.checked&&!chk_ex.checked)
img.src='/stylesheets/system/confirm.gif';else if(!chk_in.checked&&chk_ex.checked)
img.src='/stylesheets/system/delete.gif';else
img.src='/img/spacer.gif';}
function hovr(obj)
{if(Prototype.Browser.IE6)
{Event.observe(obj,'mouseover',function(){obj.addClassName('hover')});Event.observe(obj,'mouseout',function(){obj.removeClassName('hover')});}}
function on_off(id,on)
{id=$(id);id.disabled=!on;var elem=id.select('input').concat(id.select('select')).concat(id.select('textarea'));for(var i=0;i<elem.length;i++)elem[i].disabled=!on;}
function popdown(link,elem)
{if(!elem)elem=link.next();link.href="#";elem.hide();link.observe('click',function(ev){elem.toggle();ev.stop();});}
Encyc={bigger_image:function(ev){ev.stop();var img=$(ev).element();if(!img.bigger)img.bigger={thumb_src:img.src,big_src:img.src.gsub(/thumbnails\/\w+/,'thumbnails/max500x600'),thumb_title:img.title,big_title:'Click to go back to thumbnail'}
img.bigger.show=!img.bigger.show;img.src=img.bigger.show?img.bigger.big_src:img.bigger.thumb_src;img.title=img.bigger.show?img.bigger.big_title:img.bigger.thumb_title;img.style.cursor=img.bigger.show?'ne-resize':'sw-resize';img.parentNode.blur();},toggle_all_operations:function(){if(!Encyc.all_items){Encyc.all_items=$$('span.encyc-op');Encyc.all_items.each(Encyc.init_operations);}
for(var i=0;i<Encyc.all_items.length;i++){Encyc.all_items[i].toggleClassName('pin');}},init_operations:function(elem,is_mouseover){elem=$(elem);if(!elem.getAttribute('ann_loaded')){elem.firstDescendant().insert({after:'<span class="o">'+Encyc.generate_op_html(elem)+'</span>'});Encyc.observe_operations(elem,is_mouseover==true)
elem.setAttribute('ann_loaded',true);}},observe_operations:function(op_container){var icon=op_container.firstDescendant();icon.observe('click',function(){op_container.toggleClassName('pin')});},edit_url:function(code){if(code.match(/^[APC]I/))
return 'addinfo.php?code='+code;else
return 'anime-editcredits.php?code='+code;},generate_op_html:function(elem){var arr=new Array;var code=elem.getAttribute("ann_code");var edit=elem.getAttribute("ann_edit");var audit=elem.getAttribute("ann_audit");var err=elem.getAttribute("ann_err");var source=elem.getAttribute("ann_source");if(source.length<=3)source='';if(edit==1)
arr.push('<a href="'+Encyc.edit_url(code)+'" class="own">edit</a>');if(audit)
arr.push('<a href="audit/new?for='+audit+'">audit</a>')
else if(!err)
arr.push('<a href="error-report.php?code='+code+'" title="Report an error with this">error</a>');else{var label=edit==1?'<strong>error</strong>':'error';var title=err==1?'1 person reported an error with this':err+' people reported errors with this';var endorse=elem.getAttribute("ann_endorse");if(endorse)title+=' (and '+endorse+' think there is no problem)';arr.push('<a href="error-report.php?code='+code+'" title="'+title+'" class=RED>'+label+'</a>');}
if(source!='')
arr.push('<a href="javascript:void(0)" onclick="Encyc.toggle_source(this)">source</a>');else if(edit==1)
arr.push('<a href="'+Encyc.edit_url(code)+'" class=RED>no source</a>');else
arr.push('<a>no source</a>');return arr.join('<wbr>');},toggle_source:function(link){var ops=$(link);link.blur();while(!ops.getAttribute('ann_code'))ops=ops.parentNode;ops.toggleClassName('show-source');if(!link.hasClassName('src')){link.addClassName('src');var username=Encyc.user_lookup_table[ops.getAttribute('ann_user')];var str='<tr><td>'+ops.getAttribute('ann_source')+'</td></tr>';if(username)str+='<tr><td>Added by: '+username+'</td></tr>';link.insert({after:'<span class="src"><table class="layout" border="0" cellspacing="0">'+str+'</table></span>'});var span=link.next();var max_width=document.viewport.getWidth()-10-span.cumulativeOffset().left;if(max_width>500)max_width=500;span.setStyle({width:max_width+'px'});}}};var MD5=function(string){function RotateLeft(lValue,iShiftBits){return(lValue<<iShiftBits)|(lValue>>>(32-iShiftBits));}
function AddUnsigned(lX,lY){var lX4,lY4,lX8,lY8,lResult;lX8=(lX&0x80000000);lY8=(lY&0x80000000);lX4=(lX&0x40000000);lY4=(lY&0x40000000);lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);if(lX4&lY4){return(lResult^0x80000000^lX8^lY8);}
if(lX4|lY4){if(lResult&0x40000000){return(lResult^0xC0000000^lX8^lY8);}else{return(lResult^0x40000000^lX8^lY8);}}else{return(lResult^lX8^lY8);}}
function F(x,y,z){return(x&y)|((~x)&z);}
function G(x,y,z){return(x&z)|(y&(~z));}
function H(x,y,z){return(x^y^z);}
function I(x,y,z){return(y^(x|(~z)));}
function FF(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(F(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);};function GG(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(G(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);};function HH(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(H(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);};function II(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(I(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);};function ConvertToWordArray(string){var lWordCount;var lMessageLength=string.length;var lNumberOfWords_temp1=lMessageLength+8;var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1%64))/64;var lNumberOfWords=(lNumberOfWords_temp2+1)*16;var lWordArray=Array(lNumberOfWords-1);var lBytePosition=0;var lByteCount=0;while(lByteCount<lMessageLength){lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=(lWordArray[lWordCount]|(string.charCodeAt(lByteCount)<<lBytePosition));lByteCount++;}
lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=lWordArray[lWordCount]|(0x80<<lBytePosition);lWordArray[lNumberOfWords-2]=lMessageLength<<3;lWordArray[lNumberOfWords-1]=lMessageLength>>>29;return lWordArray;};function WordToHex(lValue){var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;for(lCount=0;lCount<=3;lCount++){lByte=(lValue>>>(lCount*8))&255;WordToHexValue_temp="0"+lByte.toString(16);WordToHexValue=WordToHexValue+WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);}
return WordToHexValue;};function Utf8Encode(string){string=string.replace(/\r\n/g,"\n");var utftext="";for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);if(c<128){utftext+=String.fromCharCode(c);}
else if((c>127)&&(c<2048)){utftext+=String.fromCharCode((c>>6)|192);utftext+=String.fromCharCode((c&63)|128);}
else{utftext+=String.fromCharCode((c>>12)|224);utftext+=String.fromCharCode(((c>>6)&63)|128);utftext+=String.fromCharCode((c&63)|128);}}
return utftext;};var x=Array();var k,AA,BB,CC,DD,a,b,c,d;var S11=7,S12=12,S13=17,S14=22;var S21=5,S22=9,S23=14,S24=20;var S31=4,S32=11,S33=16,S34=23;var S41=6,S42=10,S43=15,S44=21;string=Utf8Encode(string);x=ConvertToWordArray(string);a=0x67452301;b=0xEFCDAB89;c=0x98BADCFE;d=0x10325476;for(k=0;k<x.length;k+=16){AA=a;BB=b;CC=c;DD=d;a=FF(a,b,c,d,x[k+0],S11,0xD76AA478);d=FF(d,a,b,c,x[k+1],S12,0xE8C7B756);c=FF(c,d,a,b,x[k+2],S13,0x242070DB);b=FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);a=FF(a,b,c,d,x[k+4],S11,0xF57C0FAF);d=FF(d,a,b,c,x[k+5],S12,0x4787C62A);c=FF(c,d,a,b,x[k+6],S13,0xA8304613);b=FF(b,c,d,a,x[k+7],S14,0xFD469501);a=FF(a,b,c,d,x[k+8],S11,0x698098D8);d=FF(d,a,b,c,x[k+9],S12,0x8B44F7AF);c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);a=FF(a,b,c,d,x[k+12],S11,0x6B901122);d=FF(d,a,b,c,x[k+13],S12,0xFD987193);c=FF(c,d,a,b,x[k+14],S13,0xA679438E);b=FF(b,c,d,a,x[k+15],S14,0x49B40821);a=GG(a,b,c,d,x[k+1],S21,0xF61E2562);d=GG(d,a,b,c,x[k+6],S22,0xC040B340);c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);b=GG(b,c,d,a,x[k+0],S24,0xE9B6C7AA);a=GG(a,b,c,d,x[k+5],S21,0xD62F105D);d=GG(d,a,b,c,x[k+10],S22,0x2441453);c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);b=GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);a=GG(a,b,c,d,x[k+9],S21,0x21E1CDE6);d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);c=GG(c,d,a,b,x[k+3],S23,0xF4D50D87);b=GG(b,c,d,a,x[k+8],S24,0x455A14ED);a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);d=GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8);c=GG(c,d,a,b,x[k+7],S23,0x676F02D9);b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);a=HH(a,b,c,d,x[k+5],S31,0xFFFA3942);d=HH(d,a,b,c,x[k+8],S32,0x8771F681);c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);a=HH(a,b,c,d,x[k+1],S31,0xA4BEEA44);d=HH(d,a,b,c,x[k+4],S32,0x4BDECFA9);c=HH(c,d,a,b,x[k+7],S33,0xF6BB4B60);b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);d=HH(d,a,b,c,x[k+0],S32,0xEAA127FA);c=HH(c,d,a,b,x[k+3],S33,0xD4EF3085);b=HH(b,c,d,a,x[k+6],S34,0x4881D05);a=HH(a,b,c,d,x[k+9],S31,0xD9D4D039);d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);b=HH(b,c,d,a,x[k+2],S34,0xC4AC5665);a=II(a,b,c,d,x[k+0],S41,0xF4292244);d=II(d,a,b,c,x[k+7],S42,0x432AFF97);c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);b=II(b,c,d,a,x[k+5],S44,0xFC93A039);a=II(a,b,c,d,x[k+12],S41,0x655B59C3);d=II(d,a,b,c,x[k+3],S42,0x8F0CCC92);c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);b=II(b,c,d,a,x[k+1],S44,0x85845DD1);a=II(a,b,c,d,x[k+8],S41,0x6FA87E4F);d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);c=II(c,d,a,b,x[k+6],S43,0xA3014314);b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);a=II(a,b,c,d,x[k+4],S41,0xF7537E82);d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);c=II(c,d,a,b,x[k+2],S43,0x2AD7D2BB);b=II(b,c,d,a,x[k+9],S44,0xEB86D391);a=AddUnsigned(a,AA);b=AddUnsigned(b,BB);c=AddUnsigned(c,CC);d=AddUnsigned(d,DD);}
var temp=WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);return temp.toLowerCase();}