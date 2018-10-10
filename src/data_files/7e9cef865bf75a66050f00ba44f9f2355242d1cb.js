"use strict";

var J = jQuery;
var ANN = ANN || {};

J.window = J(window);
J.document = J(document);

if (document.location.host.match(/^wwwezo\./))
  document.location.replace(document.location.href.replace(/ezo/,''));

// ANN /////////////////////////////////////////////////////////////////////////
(function(){ var self=ANN;
  
  self.doc_ready =
    function(){
      if (ANN.is_ready) return;
      ANN.is_ready = true;
      ANN.debug.event('doc_ready');
      ANN.performance.start('ANNinit');
      ANN.user_preferences.init();
      ANN.notifications.init();
     try{
      ANN.custom_attr.init();
      ANN.mega_nav.init();
      ANN.sidebar.init();
      ANN.grid.init();
      ANN.marquee.init();
      ANN.layout.init();
      ANN.ads.init();
      ANN.searchbox.init();
      ANN.images.init();
      ANN.lazyload.init();
      ANN.infinite_scroll.init();
      ANN.performance.end('ANNinit');
     }
     catch(e){ ANN.notifications.js_error(e); }
    };
  
  self.set_edition =
    function(value){
      ANN.set_cookie('preferred_locale@', value, 365*86400);
      document.location.reload(true);
    };
  
  // utility functions //
  
  self.sum =
    function(){
      var n, total=0;
      for (var i=0; i<arguments.length; i++)
        if (n = parseInt(arguments[i]))
          total += n;
      return total;
    };
  
  self.round =
    function(n, precision){
      var i = 1.0 / precision; //to avoid 51 * 0.1 => 5.1000000000000005
      return Math.round(n * i) / i;
    };
  
  self.toggle =
    function(elem){
      var scrollTop = J.window.scrollTop();
      elem = J(elem.target||elem);
      if (!elem.hasClass('on') && !elem.hasClass('off')){
        elem.addClass(elem.is(':visible') ? 'on' : 'off');
      }
      elem.toggleClass('on').toggleClass('off');
      
      if (elem.hasClass('on')){
        if (elem.css('position').match(/absolute|fixed/))
          elem.css('z-index', self.toggle.z_index++);
        else
          ANN.layout.recompute_optimal();
      }
      
      //if page jumped around, return it to its original position
      J('.bottom.gutter').css('padding-top', '');
      var jump = J.window.height() - (J.body.height() - scrollTop);
      if (jump > 0) J('.bottom.gutter').css('padding-top', '+='+jump+'px');
      if (jump) J.window.scrollTop(scrollTop);
      
      return elem.hasClass('on');
    };
  self.toggle.z_index = 1000;
  
  self.safe_parse_json =
    function(str){
      self.safe_parse_json.error = null;
      if (typeof str == 'string'){
        try{
          return JSON.parse(str);
        }
        catch(e){
          self.safe_parse_json.error = e;
        }
      }
      return undefined;
    };
  
  self.modal =
    function(url, data, on_close, on_open){
      var modal_window = J('<div class="modal-window"><div><div><div><div>');
      self.modal.container = modal_window.find('div').last();
      modal_window[0].onModalClose = on_close;
      modal_window[0].data = data;
      modal_window.appendTo(document.body);
      ANN.toggle(modal_window);
      J.ajax(url, {
        error: function(){ modal_window.remove(); },
        success: function(data, textStatus, jqXHR){
          //load contents
          try{
            self.modal.container.css({position:'absolute', visibility:'hidden'});
            self.modal.container.append(data);
          }
          catch(e){
            console.error(e);
            return modal_window.remove();
          }
          //init
          self.modal.resize_container();
          J.document.on('keydown', self.modal.close_via_keydown);
          J.window.on('resize', self.modal.resize_container);
          modal_window.trigger('shown.ann5.modal');
          if (on_open) on_open(modal_window);
        }
      });
    };
  
  self.modal.close =
    function(elem){
      J.document.off('keydown', self.modal.close_via_keydown);
      J.window.off('resize', self.modal.resize_container);
      
      var modalwindow = J(elem.target||elem).closest('.modal-window');
      var callback = modalwindow[0].onModalClose;
      J.body.css('overflow-y', '');
      modalwindow.remove();
      delete self.modal.container;
      if (callback) callback();
    };
  
  self.modal.close_via_keydown =
    function(e){
      if (e.which === 27){ self.modal.close(self.modal.container); }
    };
  
  self.modal.resize_container =
    function(){
      var mc = self.modal.container;
      if (!mc) return;
      
      //reset overflow-y so we can calculate widths properly
      J.body.css('overflow-y', '');
      mc.closest('.modal-window').css('overflow-y', '');
      
      //reflow container to optimal size according to contents
      mc.css({position:'absolute', left:0 ,visibility:''});
      mc.css({width:'auto', height:'auto', maxWidth:J.body.width()-2+'px'});
      
      //fix size of container, taking into account that real width may have
      //decimals, so +1 to ensure the container is not smaller than real width
      mc.width(mc.width() + 1);
      mc.height(mc.height());
      //then revert to static position so that the contents do not overflow from
      //mc.parent during animation
      mc.css({position:'', left:'', visibility:''});
      
      //allow overflow when content has longer height than browser window
      if (window.innerHeight < mc.height()){
        J.body.css('overflow-y', 'hidden');
        mc.closest('.modal-window').css('overflow-y', 'auto');
      }
      
      //animate
      mc.parent().width(mc.width());
      mc.parent().height(mc.height());
    };
  
  RegExp.escape = RegExp.escape ||
    function(str){ return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); }
  
  self.get_cookie =
    function(name){
      var namesuffix = name.match(/@$/) ? '[^=]*' : '';
      var rx = new RegExp('(^|;) *(' + RegExp.escape(name) + namesuffix + ')=([^;]*)');
      var m = document.cookie.match(rx);
      return m && m[3] !== "-" ? m[3] : null;
    };
  
  self.set_cookie =
    function(name, value, max_age){
      var cookie = name+'='+escape(value)+'; Path=/';
      if (name.match(/@$/)){
        var domain, path;
        var rx = new RegExp('(^|;) *' + RegExp.escape(name) + '([^/=]+)(/[^=]*)');
        if (document.cookie.match(rx)){
          domain = RegExp.$2;
          path = RegExp.$3;
        }
        else{
          if (max_age < 0) return; //no point in deleting cookie that doesn't exist
          domain = document.location.host.replace(/^.*?\./,"");
          path = '/';
        }
        cookie = name+domain+path+'='+escape(value)+'; Path='+path+'; Domain=.'+domain;
      }
      if (max_age){
        //MSIE doesn't support Max-Age :-(
        var expires = (new Date()).getTime() + max_age*1000;
        cookie += '; Expires='+(new Date(expires)).toGMTString();
      }
      document.cookie = cookie;
    };
    
    self.delete_cookie =
      function(name){
        self.set_cookie(name, '-', -1);
      };

})();

// ANN.debug ///////////////////////////////////////////////////////////////////
(function(){ var self=ANN.debug={};
  
  self.messages = {};
  
  self.ON =
    function(){
      return J('#debug-msg').length;
    };
  
  self.inspect =
    function(o,i){
      if (typeof i=='undefined') i = '';
      if (i.length > 50) return '[MAX ITERATIONS]';
      var r = [];
      for (var p in o){
        var v=o[p], t=typeof v;
        r.push(i+'"'+p+'" => ');
        switch (t){
          case "boolean":
          case "number":
          case "string":
            r.push(JSON.stringify(v)); break;
          case "undefined":
            r.push('undefined'); break;
          case "function":
            r.push(v+''); break;
          case "object":
            var props = self.inspect(v,i+'   ');
            r.push(Array.isArray(v) ? '[' : '{');
            r.push(props.length ? '\n'+props+i : ' ');
            r.push(Array.isArray(v) ? ']' : '}');
            break;
          default:
            r.push('('+t+'?) '+v);
        }
        r.push('\n');
      }
      return r.join('');
    };
  
  self.msg =
    function(k,v,x){
      clearTimeout(self.refreshing);
      v = JSON.stringify(v).replace(/,/g,', ');
      console.debug(k+': '+v);
      self.messages[k] = v;
      if (!x) self.refresh();
    };
  
  self.properties =
    function(obj){
      for (var k in obj) self.msg(k, obj[k], true);
      self.refresh();
    };
  
  self.refresh =
    function(){
      var msg = [];
      for (var k in self.messages)
        msg.push('<div style="margin:2px 0 0 10px;text-indent:-10px">'+k+'='+self.messages[k]+'</div>');
      msg = msg.sort().join('');
      var h = J('#debug-msg').height();
      J('#debug-msg').html('<hr>'+msg);
      if (h != J('#debug-msg').height()) self.refreshing = setTimeout(ANN.sidebar.reflow, 100);
    };
  
  self.alert =
    function(msg){
      if (self.ON()){
        ANN.notifications.alert(msg);
      }
    };
  
  self.event0 = new Date();
  self.events = {};
  self.event =
    function(msg){
      var d = self;
      var t1 = new Date() - d.event0;
      if (d.events[t1]) msg = d.events[t1] + '+' + msg;
      d.events[t1] = msg;
      d.msg('events', d.events);
    };
  
})();

// ANN.performance /////////////////////////////////////////////////////////////
(function(){ var self=ANN.performance={};
  
  var times = [];
  var t_start = {};
  
  self.logger = "/logger.performance";
  self.log = [];
  
  self.start =
    function(name){
      t_start[name] = (new Date).getTime();
    };
  
  self.end =
    function(name){
      times.push([name, t_start[name], (new Date).getTime()]);
    };
  
  J.window.on('load', function(){
    var wpt = window.performance.timing;
    var nav0 = Math.min(wpt.navigationStart, wpt.fetchStart) || 0;
    
    var ptimes = [];
    function t1(n){ ptimes.push([n, wpt[n], null]); }
    function t12(n){ ptimes.push([n, wpt[n+'Start'], wpt[n+'End']]); }
    //order in which they occur during the navigation process (theoretically)
    t12('unloadEvent');
    t12('redirect');
    t12('fetch');
    t12('domainLookup');
    t12('connect');
    t12('secureConnection');
    t12('request');
    t12('response');
    t1('domLoading');
    t1('domInteractive');
    t12('domContentLoadedEvent');
    t1('domComplete');
    t12('loadEvent');
    times = ptimes.concat(times);
    
    self.log.push(document.render_time ? 'render=~'+Math.round(document.render_time) : '');
    
    for (var i=0; i<times.length; i++){
      var name = times[i][0], t1 = times[i][1], t2 = times[i][2];
      if (typeof t1 != "number" || !t1)
        self.log.push('');
      else if (!t2 || t2 === t1 || t2 === t1+1)
        self.log.push(name+'='+(t1-nav0));
      else
        self.log.push(name+'='+(t1-nav0)+'-'+(t2-nav0));
    }
    self.log.push('nav0='+nav0);
    
    J.ajax(self.logger + '?' + self.log.join('&'));
  });
  
})();

// ANN.viewport ///////////////////////////////////////////////////////////////////
(function(){ var self=ANN.viewport={};
  
  self.scroll_to =
    function(elem){
      J('html, body').animate({scrollTop: elem.offset().top}, 500);
    };
  
  self.scrollbar_width =
    function(){
      var inner = document.createElement('p');
      inner.style.width = "100%";
      inner.style.height = "200px";
      
      var outer = document.createElement('div');
      outer.style.position = "absolute";
      outer.style.top = "0px";
      outer.style.left = "0px";
      outer.style.visibility = "hidden";
      outer.style.width = "200px";
      outer.style.height = "150px";
      outer.style.overflow = "hidden";
      outer.appendChild(inner);
      
      document.body.appendChild(outer);
      var w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth;
      if (w1 == w2) w2 = outer.clientWidth;
      
      document.body.removeChild(outer);
      inner = outer = null;
      
      self.scrollbar_width = function(){ return (w1 - w2); }
      return (w1 - w2);
    };
  
  self.resize =
    function(w,h){
      if (w <= 768) w += self.scrollbar_width();
      if (self.resize.overhead) w += self.resize.overhead;
      window.resizeTo(w, h);
      self.resize.overhead = w - J.body.width() - self.scrollbar_width();
    };
  
  //where is the element vertically relative to the viewport
  //  0 if in the viewport
  // -N if N pixels above
  //  N if N pixels below
  // null if element is not visible
  self.offset =
    function(el){
      var rect = el.getBoundingClientRect();
      var visible = rect.top||rect.left||rect.bottom||rect.right;
      if (!visible) return null;
      var above = rect.bottom - 1;
      if (above < 0) return above;
      var below = rect.top - window.innerHeight + 1;
      if (below > 0) return below;
      return 0;
    };
  
})();

// ANN.date ////////////////////////////////////////////////////////////////////
(function(){ var self=ANN.date={};
  
  self.time_elem =
    function(d, elem){
      var d_str = self.strftime('%Y-%b-%d %T %Z', d).replace(":00 "," ");
      if (elem.is('[ago]'))
        elem.html(self.time_ago(d));
      else if (elem.is('[rel]'))
        elem.html(self.time_diff(d));
      else
        d_str += ' (' + self.time_diff(d) + ')';
      elem.attr('title', d_str);
    };
  
  self.time_diff =
    function(d, ref){
      function diffstr(n, unit, limit){
        if (n >= limit)
          n = Math.round(n);
        else
          n = (Math.round(n*10)/10.0 + '.0').replace(/(\.\d).*/,'$1');
        if (n >= 2) unit += 's';
        return n+' '+unit;
      };
      if (!ref) ref = new Date();
      var diff = Math.abs(d - ref),
          suffix = d < ref ? ' ago' : ' from now';
      if (diff == 0) return 'now';
      diff /= 1000;  if (diff < 30.0) return 'seconds'+suffix;
      diff /= 60;    if (diff < 59.5) return Math.round(diff)+' min.'+suffix;      // 1 to 59 min. ago
      diff /= 60;    if (diff < 24.5) return diffstr(diff, 'hour', 9.95)+suffix;   // 1.0 to 9.9 to 24 hours ago
      diff /= 24;    if (diff < 31.5) return diffstr(diff, 'day', 9.95)+suffix;    // 1.0 to 9.9 to 31 days ago
      diff /= 365/12;if (diff < 12.5) return diffstr(diff, 'month', 3.95)+suffix;  // 1.0 to 3.9 to 12 months ago
      diff /= 12;                     return diffstr(diff, 'year', 9.95)+suffix;   // 1.0 to 9.9 to 9999 years ago
    };
  
  self.time_ago =
    function(d){
      var now = new Date();
      if (d > now) return 'seconds ago';
      return self.time_diff(d, now);
    };
  
  self.month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  self.strftime =
    function(str, dt){
      if (str == 'MDTZ') str = '(%b %e, %T <abbr title="UTC%z">%Z</abbr>)';
      function n2(n){ return (n<10 ? "0" : "") + n; }
      var dtstr = dt.toString(),
          weekday = dtstr.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/) ? RegExp.$1 : '',
          month_name = self.month_names[dt.getMonth()],
          zone_num = dtstr.match(/GMT([+-]\d{4})/) ? RegExp.$1 : null,
          zone_name = dtstr.match(/\b(?!GMT)([A-Z]{3,})\b/) ? RegExp.$1 : null,
          y=n2(dt.getFullYear()), m=n2(dt.getMonth()+1), d=n2(dt.getDate()),
          H=n2(dt.getHours()), M=n2(dt.getMinutes()), S=n2(dt.getSeconds());
      return str
        .replace(/%%/g, '&#x25;')
        .replace(/%Y/g, y) //Year with century
        .replace(/%m/g, m)
        .replace(/%d/g, d)
        .replace(/%e/g, dt.getDate())
        .replace(/%H/g, H)
        .replace(/%M/g, M)
        .replace(/%S/g, S)
        .replace(/%a/g, weekday)
        .replace(/%b/g, month_name)
        .replace(/%z/g, zone_num||zone_name||'')
        .replace(/%Z/g, zone_name||zone_num||'')
        .replace(/%F/g, y+'-'+m+'-'+d)//ISO 8601 date
        .replace(/%T/g, H+':'+M+':'+S)//24-hour time
      ;
    };
  
  self.strftime.diff_MDTZ =
    function(date,now){
      return ' ' + self.time_diff(date,now) + ' ' + self.strftime('MDTZ',date);
    };
  
  self.validate_nb_days =
    function(){
      var str = this.value+' ', d = 0;
      str = str.replace(/(\d+(\.\d+)?)s|$/,""); d += parseFloat(RegExp.$1) || 0;
      str = str.replace(/(\d+(\.\d+)?)m|$/,""); d += parseFloat(RegExp.$1)*60 || 0;
      str = str.replace(/(\d+(\.\d+)?)h|$/,""); d += parseFloat(RegExp.$1)*3600 || 0;
      str = str.replace(/^\s*(\d+(\.\d+)?)d?|$/,""); d += parseFloat(RegExp.$1)*86400 || 0;
      if (str.match(/\w/)){
        this.invalid_number = true;
        this.nb_seconds = null;
      }
      else{
        this.invalid_number = false;
        this.nb_seconds = Math.round(d);
        this.value = Math.round(d) / 86400;
        if (this.value.indexOf(".") < 0) this.value += ".0";
      }
    };
  
})();

// ANN.custom_attr /////////////////////////////////////////////////////////////
(function(){ var self=ANN.custom_attr={};
  
  self.init =
    function(){
      J('time').each(function(){
        var elem = J(this);
        var d = Date.parse(elem.attr('datetime'));
        if (d) ANN.date.time_elem(new Date(d), elem);
      });
      J('.button.dropdown').not('.readonly').click(function(){
        J(this).toggleClass('active');
      });
      J('a[untracked-href]')
        .each(function(){
          this.tracked_href = this.href;
          this.href = this.untracked_href = J(this).attr('untracked-href');
        })
        .on('mousedown', function(){ this.href = this.tracked_href; })
        .on('click', function(){ this.href = this.tracked_href; })
        .on('mouseout', function(){ this.href = this.untracked_href; });
      J('textarea, input[type="text"]')
        .on('keydown', self.macron_keydown)
        .on('keypress', self.macron_keypress);
      J('img.animated-gif')
        .each(self.setup_animated_gif_toggle);
    };
  
  self.macron_keydown =
    function(event){
      if (event.altKey &&
           (event.which == 189 || //hyphen in Chrome
            event.which == 173 || //hyphen in Firefox
            event.which == 109)   //minus on numeric keypad
           ){
        this.macronize = true;
        event.preventDefault();
      }
    };
  
  self.macron_keypress =
    function(event){
      if (event.which == 175 && !this.macronize){
        this.macronize = true;
        event.preventDefault();
      }
      else if (this.macronize){
        var macronChar;
        switch (event.which){
          case 65:  macronChar = 'Ā'; break;
          case 69:  macronChar = 'Ē'; break;
          case 73:  macronChar = 'Ī'; break;
          case 79:  macronChar = 'Ō'; break;
          case 85:  macronChar = 'Ū'; break;
          case 97:  macronChar = 'ā'; break;
          case 101: macronChar = 'ē'; break;
          case 105: macronChar = 'ī'; break;
          case 111: macronChar = 'ō'; break;
          case 117: macronChar = 'ū'; break;
        }
        if (macronChar){
          //does not work for IE <= 8
          if (typeof this.selectionStart == "number" && typeof this.selectionEnd == "number") {
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.slice(0, start) + macronChar + this.value.slice(end);
            this.selectionStart = this.selectionEnd = start + 1;
            event.preventDefault();
          }
        }
        this.macronize = false;
      }
    };
  
  self.setup_animated_gif_toggle =
    function(){
      var img = J(this);
      if (img.parent('a').length) return; //cannot toggle if img is a link
      var span = img.wrap('<span class="animated-gif"></span>').parent();
      span.addClass(img.hasClass('stop') ? 'stop' : 'play');
      span.prepend('<div class="play"></div><div class="stop"></div>');
      img.add(span.find('div')).on('click', function(){
        if (span.hasClass('stop')){
          span.removeClass('stop').addClass('play');
          img.attr('src', img.attr('gif_play'));
        }
        else{
          span.removeClass('play').addClass('stop');
          img.attr('src', img.attr('gif_stop'));
        }
      });
    };
  
})();

// ANN.sidebar /////////////////////////////////////////////////////////////////
(function(){ var self=ANN.sidebar={};
  
  self.init =
    function(){
      if (J('#sidebar').length == 0) return;
      self.current_mode = 'static';
      self.minimized = ANN.user_preferences.get('sidebar_minimize');
      self.text_view = !ANN.user_preferences.get('sidebar_images');
      self.j = {
        sidebar: J('#sidebar'),
        sidebar_div: J('#sidebar>div'),
        main_div: J('#main>div')
      };
      if (self.text_view)
        J('#sidebar').removeClass('thumb-view').addClass('text-view');
      self.box_width = J('#sidebar .box').outerWidth();
      ANN.debug.msg('sidebar.box_width', self.box_width);
      J('#sidebar>div').imagesLoaded(function(){
        ANN.debug.event('sidebar.imagesLoaded');
        self.container = this;
        self.scroll();
        J.window.scroll(self.scroll);
      });
    };
  
  self.check_columns =
    function(toggle){
      var w = J('#sidebar').width();
      if (w != self.width){
        self.width = w;
        self.reflow();
      }
    };
  
  self.reflow =
    function(){
      if (self.container){
        self.scroll();
      }
    };
  
  self.find_mode =
    function(){
      var j = self.j;
      
      var maindiv_height = j.main_div.outerHeight();
      var sidediv_height = j.sidebar_div.outerHeight();
      var sidebar_height = j.sidebar.height();
      
      var sidebar_top = j.sidebar.offset().top;
      var sidebar_bottom = sidebar_top + sidebar_height;
      
      var sidediv_top = j.sidebar_div.offset().top;
      var sidediv_bottom = sidediv_top + sidediv_height;
      
      var prev_viewport_top = j.viewport_top||0;
      var viewport_top = j.viewport_top = J.window.scrollTop();
      var viewport_bottom = viewport_top + J.window.height();
      var scrolldown = viewport_top - prev_viewport_top;
      
      //sidediv does not need special handling because...
      if (ANN.layout.mode.sidebar == 0) return 'static'; //sidebar is minimized, under main area
      if (sidediv_height >= maindiv_height) return 'static'; //larger than main
      if (sidediv_height >= sidebar_height) return 'static'; //fills sidebar
      if (sidebar_top > viewport_top) return 'static'; //top of sidebar is visible
      
      //sidediv fits entirely in viewport
      if (sidediv_height < Math.min(viewport_bottom,sidebar_bottom) - viewport_top) return 'sticky-top';
      
      //bottom of sidebar is above fold
      if (sidebar_bottom < viewport_bottom && ANN.infinite_scroll.status !== 'running') return 'scrolled-to-bottom';
      
      //scrolling down...
      if (scrolldown > 0){
        if (sidediv_bottom < viewport_bottom)
          return 'sticky-bottom';
        if (self.current_mode == 'sticky-top')
          return 'hanging '+j.sidebar_div.css('top', sidediv_top - sidebar_top - scrolldown);
      }
      //scrolling up...
      else{
        if (self.current_mode == 'hanging' && sidediv_top > viewport_top)
          return 'sticky-top';
        if (self.current_mode == 'sticky-top')
          return 'sticky-top';
        if (self.current_mode == 'sticky-bottom')
          return 'hanging '+j.sidebar_div.css('top', sidediv_top - sidebar_top - scrolldown);
        if (self.current_mode == 'scrolled-to-bottom')
          return 'hanging '+j.sidebar_div.css('top', sidediv_top - sidebar_top);
      }
      return self.current_mode;
    };
  
  self.scroll =
    function(){
      var mode = self.find_mode(),
          sidebar = self.j.sidebar;
      
      if (mode != self.current_mode){
        if (mode.match(/hanging/))
          mode = 'hanging';
        else
          self.j.sidebar_div.css('top', '');
        
        self.current_mode = mode;
        sidebar
        .toggleClass('hanging', mode=='hanging')
        .toggleClass('sticky-top', mode=='sticky-top')
        .toggleClass('sticky-bottom', mode=='sticky-bottom')
        .toggleClass('scrolled-to-bottom', mode=='scrolled-to-bottom');
      }
    };
  
  self.minimize =
    function(on, do_not_set){
      if (!do_not_set){ ANN.user_preferences.set('sidebar_minimize', !!on); }
      self.minimized = on;
      ANN.layout.reflow();
    };
  
  self.mode_if_minimized =
    function(mode){
      var icons = J('#sidebar .options-menu .icon');
      icons.filter('.minimize-off').css('color', mode==0 ? '#888' : '');
      if (self.minimized) mode = 0;
      return mode;
    };
  
  self.images =
    function(on, do_not_set){
      if (!do_not_set){ ANN.user_preferences.set('sidebar_images', !!on); }
      self.text_view = !on;
      if (on)
        J('#sidebar').addClass('thumb-view').removeClass('text-view');
      else
        J('#sidebar').removeClass('thumb-view').addClass('text-view');
      ANN.lazyload.renew();
    };
  
})();

// ANN.notifications ///////////////////////////////////////////////////////////
(function(){ var self=ANN.notifications={};
  
  self.CLOSE_BUTTON = '<del onclick="J(this.parentNode).hide()">×</del>';
  
  self.init =
    function(){
      self.container = J('#notifications');
      self.container.find('.box:not(.reminder)').prepend(self.CLOSE_BUTTON);
      self.init_reminders();
    };
  
  self.js_error =
    function(err){
      var stack='';
      try{ stack = err.stack.trim(); }catch(e){ }
      self.alert('An unexpected javascript error occured. '+
          'Please report the following information in the <a href="/bbs/phpBB2/viewforum.php?f=6">bugs forum</a>:<blockquote>'+
          'error: '+err.message+'<br>'+
          'time: '+(new Date).toString()+'<br>'+
          'browser: '+navigator.userAgent+'<br>'+
          'trace: '+stack.replace(/\n/g,"<br>       ")+
          '</blockquote>');
    };
  
  self.alert =
    function(msg){
      self.container.append('<div class="alert box">'+self.CLOSE_BUTTON+msg+'</div>');
    };
  
  self.warning =
    function(msg){
      self.container.append('<div class="warning box">'+self.CLOSE_BUTTON+msg+'</div>');
    };
  
  self.notice =
    function(msg){
      self.container.append('<div class="notice box">'+self.CLOSE_BUTTON+msg+'</div>');
    };
  
  self.init_reminders =
    function(){
      if (!self.will_attach_reminder_behaviours){
        J('.reminder-close-options').remove();
        return;
      }
      
      var pending = self.reminders_storage.pending().map(function(record){
        return '#reminder-' + record.herald_id;
      }).join(', ');
      self.container.find('.reminder').not(pending).addClass('reminder--visible');
      
      J.window.click(function(){
        J('.reminder-close-options').removeClass('active');
      });
      self.container.find('.reminder:visible').on('click', 'del', function(e){
        e.stopPropagation();
        J(this).next('.reminder-close-options').addClass('active');
      }).each(function(){
        var reminder = J(this);
        var id = parseInt(reminder.prop('id').match(/\d+/)[0]);
        reminder.find('.reminder-close-options li').each(function(){
          var list_item = J(this);
          list_item.click(self.remind_function(id, list_item.data('value')));
        });
      });
    };
  
  self.remind_function =
    function(id, days){
      return function(){
        var remind_at = new Date();
        remind_at.setDate(remind_at.getDate() + days);
        self.reminders_storage.create({ herald_id: id, remind_at: remind_at });
        J(this).closest('.reminder').hide();
      };
    };
  
  self.will_attach_reminder_behaviours =  
    !document.location.host.match(/^admin/);
  
  self.reminders_storage = {
    all: function(){
      this.default();
      var records = JSON.parse(localStorage.herald_notifications);
      return records.map(function(record){
        record.remind_at = new Date(record.remind_at);
        return record;
      });
    },
    pending: function(){
      var now = this.now;
      return this.all().filter(function(record){
        return record.remind_at >= now
      });
    },
    create: function(record){
      var records = this.all();
      records.push(record);
      localStorage.herald_notifications = JSON.stringify(records);
      return record;
    },
    default: function(){
      if (localStorage.herald_notifications){ return; }
      localStorage.herald_notifications = JSON.stringify([]);
    },
    now: new Date()
  };
  
  self.generic_error_handler =
    function(jqXHR, textStatus, errorThrown){
      if (jqXHR.responseText.match(/\S/) && !jqXHR.responseText.match(/</))
        ANN.notifications.alert(jqXHR.responseText);
      else
        ANN.notifications.alert('An error prevented this action from being completed.');
    };

})();

// ANN.mega_nav ////////////////////////////////////////////////////////////////
(function(){ var self=ANN.mega_nav={};
  
  self.init =
    function(){
      var nav = self.container = J('nav#mega');
      self.spans = nav.find('>div>span');
      var video = nav.find('.video.menu');
      if (video.find('ul.colspan2of3 li').length == 1){
        video.find('ul.colspan2of3').hide().next().addClass('colspan1of1');
      }
      
      nav.find('input').focus(
        function(){
          self.pin(J(this).parents('div.menu').first());
        }
      );
      
      self.spans.click(
        function(){
          var div = J(this).parent();
          if (div.hasClass('login')){
            var p = div.find('input[name="p"]');
            p.before(p.prop('outerHTML').replace(/hidden/,'password'));
            p.remove();
          }
          if (div.hasClass('on')){
            self.pin(null);
          }
          else{
            self.pin(div);
          }
        }
      );
    };
  
  self.pin =
    function(div){
      var on = self.container.find('.menu.on');
      on.removeClass('on');
      on.find('>div').css('height', '0')
        .removeClass('overflow-ok').find('.qn-menu').removeClass('on').addClass('off');
      if (div && div.length) div.addClass('on');
      self.adjust_height();
    };
  
  self.adjust_height =
    function(div){
      var on = self.container.find('.menu.on');
      var h = 0;
      if (on.length){
        h = on.find('nav').outerHeight();
        on.find('>div').css('height', h);
      }
      self.container.parent().css('margin-bottom', h);
    };
  
  self.set_font_size =
    function(){
      var nav_width = J('nav#mega').width();
      var i = 101;
      if (ANN.layout.mode.mobile == 0){
        for (i=90; i<=120; i+=10){
          if (self.size_at(i) >= nav_width) break;
        }
        for (i-=10; i<=120; i++){
          if (self.size_at(i) >= nav_width) break;
        }
      }
      self.container.css('font-size', i-1+'%');
      var p = self.spans.parent();
      var offset = Math.round((p.last().position().top - p.position().top) / p.outerHeight()) + 1;
      self.container.toggleClass('offset2', offset==2)
                    .toggleClass('offset3', offset==3)
                    .toggleClass('offset4', offset==4);
      self.adjust_height();
    };
  
  self.size_cache = [];
  self.size_at =
    function(i){
      var n = self;
      if (!n.size_cache[i]){
        n.container.css('font-size', i+'%');
        // If we try to sum the width of the spans, we accumulate a precision/rounding
        // error such that the calculated width is not equal to the actual width.
        // So instead we use leftPos+width of the last left-floated menu.
        var menu0 = n.spans.first().parent(),
            menu8 = n.spans.slice(-2,-1).parent(),
            menu9 = n.spans.last().parent();
        if (menu8.position().top != menu0.position().top) return 99999;
        n.size_cache[i] = menu8.position().left + menu8.outerWidth() + menu9.outerWidth() + 1;
      }
      return n.size_cache[i];
    };
  
})();

// ANN.layout //////////////////////////////////////////////////////////////////
(function(){ var self=ANN.layout={};
  
  self.mode =
    {
      set: function(type, newvalue){
        var modename = type+'-mode-', oldvalue = this[type];
        if (newvalue != oldvalue){
          J.body.removeClass(modename+oldvalue).addClass(modename+newvalue);
          this[type] = newvalue;
          if (type == 'grid') J.body.toggleClass('grid-mode-not-1',newvalue!=1);
          return true;
        }
      }
    };
  
  self.header_minimum = 615; //below 615px there's not enough space to fit the header/menu in one line
  
  self.body_start =
    function(){
      if (document.body && document.body.className){
        self.body_start = function(){};
        var c = document.body.className;
        J.body = J(document.body);
        
        c.match(/skin-mode-(\d+)/);    self.mode.skin = parseInt(RegExp.$1);
        c.match(/mobile-mode-(\d+)/);  self.mode.mobile = parseInt(RegExp.$1);
        c.match(/gutter-mode-(\d+)/);  self.mode.gutter = parseInt(RegExp.$1);
        c.match(/sidebar-mode-(\d+)/); self.mode.sidebar = parseInt(RegExp.$1);
        c.match(/grid-mode-(\d+)/);    self.mode.grid = parseInt(RegExp.$1);
        c.match(/(\w+)-device/);       self.mode.device = RegExp.$1;
        
        var mob = J.body.width() < self.header_minimum;
        self.mode.set('mobile',  mob ? 1 : 0);
        self.mode.set('gutter',  mob ? 0 : 2);
        self.mode.set('sidebar', mob ? 0 : 1);
        self.mode.set('grid',    mob ? 1 : 3);
        
        document.body.className = document.body.className.replace("js-off", "js-on");
      }
    };
  
  self.init =
    function(){
      var r = self;
      ANN.debug.event('init');
      r.top_gutter = J('.top.gutter');
      r.left_gutter = J('.left.gutter');
      r.canvas = J('#canvas');
      r.main = J('#main');
      r.sidebar = J('#sidebar');
      r.right_gutter = J('.right.gutter');
      r.bottom_gutter = J('.bottom.gutter');
      
      r.init_gutters();
      r.sidebar.single_width = r.sidebar.outerWidth();
      r.sidebar.double_width = r.sidebar.single_width + r.sidebar.find('>div').width();
      r.main.div = J('#main>div').get(0);
      r.main.hasOverflow = function(){ return Math.max(r.main.div.scrollWidth - r.main.div.clientWidth, 0); };
      
      r.reset();
      J.window.load(function(){self.reset_if_image_changed()});
      J.window.resize(function(){self.reflow()});
      
      var mylist = J('.mylist-css #mylist-content-inner table');
      if (mylist.length){
        var cpt = 0;
        var check = function(){
          if (mylist.find('tbody tr').length)
            r.reset();
          else if (cpt++ < 200)
            setTimeout(check,100);
        };
        setTimeout(check,100);
      }
      self.easyread.init();
    };
  
  self.init_gutters =
    function(){
      J.each([self.top_gutter, self.left_gutter, self.right_gutter, self.bottom_gutter], function(i,g){
        g.link = g.find('a');
        g.link.width('');
        g.fixed = g.link.css('position') == 'fixed';
        g.min_width = ANN.sum(g.css('min-width'));
        g.max_width = ANN.sum(g.link.css('max-width'));
      });
    };
  
  self.reset_if_image_changed =
    function(){
      var different;
      J('#main img').each(function(){
          different = this.clientWidthMemo != this.clientWidth;
          if (different) return false;
      });
      if (different) self.reset();
    };
  
  self.reset =
    function(){
      ANN.debug.event('reset');
      J('#main img').each(function(){
          this.clientWidthMemo = this.clientWidth;
      });
      if (self.mode.skin) self.mode.set('skin', J('.top.gutter').height() ? 1 : 2);
      self.state = {};
      self.reflow();
    };
  
  self.reflow =
    function(){
      self.set_mobile_mode();
      
      self.detect_minimal_width();
      self.choose_layout_mode();
      
      if (self.detect_minimal_width()){
        self.choose_layout_mode();
      }
      
      if (!self.mode.mobile)
        self.verify_overflow();
      
      ANN.sidebar.reflow();
    };
  
  self.set_mobile_mode =
    function(){
      if (self.mode.set('mobile', J.body.width() < self.header_minimum ? 1 : 0)) {
        self.state.width = null;
        ANN.lazyload.renew();
      }
      
      var key = 'main_size.mobile-'+self.mode.mobile;
      if (!self.state[key]){
        var c = self.state[key] = {};
        c.minimal = '';
        c.padding = self.main.outerWidth() - self.main.width();
        c.fair = self.sidebar.single_width
               ? 1024-20-self.sidebar.single_width //fair+sidebar = 1024-scrollbar
               : 728+c.padding; //enough space for leaderboard
        c.optimal = self.compute_optimal(c);
      }
      self.main.current = self.state[key];
      
      if (!self.state.width){
        self.main.css({ 'min-width': self.main.current.minimal });
      }
    };
    
  self.compute_optimal =
    function(c){
      if (self.mode.mobile) return null;
      var optimal;
      if (ANN.grid.mainfeed)
        optimal = (400+ANN.grid.box_padding)*5 + c.padding;
      else{
        if (self.optimal_computed) J('.same-width-as-main').css('width', '');
        var cw = self.canvas.width(),
            mw = self.main.outerWidth(),
            sw = self.mode.sidebar ? self.sidebar.outerWidth() : 0;
        if (mw >= cw - sw){
          J('#content').addClass('test-optimal');
          mw = self.main.outerWidth();
          if (self.main.hasOverflow()) ANN.debug.alert('#main has overflow even when test-optimal!');
          J('#content').removeClass('test-optimal');
        }
        optimal = Math.max(mw, c.fair, c.optimal||0);
      }
      J('.same-width-as-main').css('width', 'auto');
      self.optimal_computed = true;
      return optimal;
    };
  
  self.recompute_optimal =
    function(){
      var c = self.main.current;
      var old = c.optimal;
      c.optimal = self.compute_optimal(c);
      if (c.optimal != old) self.reflow();
    };
  
  self.verify_overflow =
    function(){
      var o = self.main.hasOverflow();
      if (o && ANN.debug.ON()){
        ANN.debug.alert('#main overflow='+o+' even though min-width='+self.main.css('min-width'));
        J('#main').css('background-color','red');
        var x = J('#main *').css('background-color','white');
        x = jQuery.makeArray(x);
        while (x.length){
          var elem = x.pop();
          if (!elem.tagName.match(/^(wbr)$/i))
            elem.style.display = 'none';
          if (o != self.main.hasOverflow()){
            elem.className += " overflow-changed";
            ANN.debug.alert('problem element @ '+elem.tagName+'.overflow-changed');
            break;
          }
        }
        self.main.div.style.overflow = 'visible';
        self.set_mobile_mode = null;
        self.bugout();
      }
      return o;
    };
  
  self.detect_minimal_width =
    function(){
      var c = self.main.current;
      if (!c.minimal){
        var o = self.main.hasOverflow();
        if (o){
          c.minimal = self.main.outerWidth() + o;
          self.main.css('min-width', c.minimal);
          //ANN.debug.alert('minimal = '+c.minimal);
          if (c.optimal && c.minimal > c.optimal) //may happen if child element misbehaves; like width=100% with padding>0
            c.minimal = c.optimal;
          return true;
        }
      } 
    };
  
  self.choose_layout_mode =
    function(){
      var available = J.body.width(),
          left = self.left_gutter.min_width,
          minimal = self.main.current.minimal || 0,
          minimal_fair = Math.max(minimal,self.main.current.fair-100),
          optimal = self.main.current.optimal,
          sidebar = self.sidebar.single_width,
          sidebar2 = self.sidebar.double_width,
          right = self.right_gutter.min_width;
      
      if (self.mode.mobile)
        return self.set_mode(0,0);
      if (self.allow_double_sidebar && available >= left + optimal + sidebar2 + right)
        return self.set_mode(2,2);
      if (available >= left + optimal + sidebar + right)
        return self.set_mode(2,1);
      
      //not quite enough space for everything; decide what gets the axe
      
      if (left || right) //skin
      {
        if (self.drop_sidebar_early)
        { //drop sidebar if it would cause content to be less than optimal width
          if (available >= left + optimal + right)
            return self.set_mode(2,0);
          if (available >= left + minimal_fair + right && available > 1200)
            return self.set_mode(2,0);
          if (available >= left + minimal_fair)
            return self.set_mode(1,0);
        }
        else
        {
          if (available > 1200){
            if (available >= left + minimal_fair + sidebar + right)
              return self.set_mode(2,1);
            if (available >= left + minimal_fair + right)
              return self.set_mode(2,0);
          }
          if (available >= left + minimal_fair + sidebar)
            return self.set_mode(1,1);
          if (available >= left + optimal + right)
            return self.set_mode(2,0);
          if (available >= left + minimal_fair)
            return self.set_mode(1,0);
        }
        return self.set_mode(0,0);
      }
      else //no skin
      {
        if (self.drop_sidebar_early)
          return self.set_mode(2,0);
        if (available >= minimal_fair + sidebar)
          return self.set_mode(2,1);
        
        return self.set_mode(2,0);
      }
    };
  
  self.set_mode =
    function(gutter, sidebar){
      if (!self.sidebar.length) sidebar = 0;
      if (gutter==1 && self.right_gutter.min_width==0) gutter = 2;
      sidebar = ANN.sidebar.mode_if_minimized(sidebar);
      
      if (self.mode.gutter != gutter || self.mode.sidebar != sidebar || !self.state.width){
        self.mode.set('gutter', gutter);
        self.mode.set('sidebar', sidebar);
        self.state.width = {
          left_gutter:  ANN.sum(J('.left.gutter:visible' ).css('min-width')),
          right_gutter: ANN.sum(J('.right.gutter:visible').css('min-width')),
          sidebar: sidebar ? self.sidebar.outerWidth() : 0
        }
      }
      
      self.set_mode_widths();
      ANN.marquee.set_ratio();
    };
  
  self.set_mode_widths =
    function(){
      var w = self.state.width;
      
      w.body = J.body.width();
      if (J.browser.webkit) w.body -= 2; //Webkit bug https://code.google.com/p/chromium/issues/detail?id=34224
      w.main_max = w.body - w.left_gutter - w.sidebar - w.right_gutter;
      if (w.main_max < self.main.current.minimal) w.main_max = self.main.current.minimal;
      ANN.grid.set_mainfeed_width();//this may modify w.main_max
      
      var m = Math.min(w.main_max, self.main.current.optimal || w.body);
      if (self.mode.sidebar==0 && self.mode.mobile==0) m = Math.max(m, 728+self.main.current.padding);
      self.main.css({   'width': m,             'max-width': w.main_max             });
      self.canvas.css({ 'width': m + w.sidebar, 'max-width': w.main_max + w.sidebar });
      J('#page').css('width', '100%'); //set here instead of css, to prevent FOUC
      
      var l = self.left_gutter, lw = l.width(),
          t = self.top_gutter, tw = t.width(),
          b = self.bottom_gutter, bw = b.width(),
          r = self.right_gutter, rw = r.width();
      if (l.fixed) l.link.width(lw);
      if (r.fixed) r.link.width(rw);
      l.toggleClass('full-image', lw <= l.max_width);
      t.toggleClass('full-image', tw == t.link.width());
      b.toggleClass('full-image', bw == b.link.width());
      r.toggleClass('full-image', rw <= r.max_width);
      
      ANN.grid.set_grid_mode();
      //if (self.main.hasOverflow() || self.main.img_width_limit) self.limit_img_width();
      ANN.sidebar.check_columns();
      ANN.mega_nav.set_font_size();
    };
  
/*
  self.limit_img_width =
    function(){
      var r = self;
      var desiredsize = r.state.width.main_max - r.main.current.padding;
      var img = J('.text-zone img');
      img = img.filter(function(){ return !this.clientWidth || this.clientWidth >= 100; });
      if (img.length==0) return;
      
      //first-time default value
      if (!r.main.img_width_limit){
        img.css('max-width', desiredsize);
      }
      //if screen expanded by X, increase max-width by same value
      else if (r.main.img_width_limit < desiredsize){
        var enlarge = desiredsize - r.main.img_width_limit;
        for (var i=0; i<img.length; i++)
          img[i].style.maxWidth = Math.min(ANN.sum(img[i].style.maxWidth, enlarge), desiredsize) + 'px';
      }
      //smoothly shrink max-width so images fit in screen without h-scrolling
      var targetsize = r.main.div.scrollWidth;
      var before = targetsize;
      while (targetsize > desiredsize){
        targetsize -= ((targetsize - desiredsize) >> 2) || 1;
        img.sort(function(a,b){return b.clientWidth-a.clientWidth});//from largest to smallest image
        for (var i=0; i<img.length; i++){
          var overhead = r.main.div.scrollWidth - J(img[i]).parent().width();
          img[i].style.maxWidth = Math.max(targetsize - overhead, 100) + 'px';
          if (r.main.div.scrollWidth == targetsize) break;
        }
        //abort loop if reducing max-width had no impact on #main width
        var after = r.main.div.scrollWidth;
        if (after == before) break;
        before = after;
      }
      
      if (r.main.div.scrollWidth >= desiredsize){
        r.main.img_width_limit = desiredsize;
      }
      else{
        r.main.img_width_limit = null;
        img.css('max-width', '');
      }
    };
*/
  
})();

// ANN.layout.easyread /////////////////////////////////////////////////////////
(function(self){
  
  self.init =
    function(){
      var $style_sheet = J('.easyread-style-sheet');
      if ($style_sheet.length === 0){
        $style_sheet = J('<style class="easyread-style-sheet"></style>');
        $style_sheet.appendTo(J.body);
      }
      self.style_sheet = $style_sheet[0].sheet;
    };
  
  self.update =
    function(){
      var n = ANN.user_preferences.get('easyread_text_width');
      n *= 0.5;
      
      while (self.style_sheet.cssRules.length > 0)
        self.style_sheet.deleteRule(self.style_sheet.cssRules.length - 1);
      
      for (var i = 0; i < self.templates.length; i++){
        self.style_sheet.insertRule(
          self.templates[i].replace('{{width}}', n).replace('{{forum_width}}', n + 9),
          i
        );
      }
      
      ANN.layout.reset();
    };
  
  self.templates = [
    'body.mobile-mode-0 .easyread-width, body.mobile-mode-0 .easyread-maxwidth { max-width: {{width}}em; }',
    'body.mobile-mode-0 .maincontent.forum { width: {{forum_width}}em; }'
  ];
  
}(ANN.layout.easyread = {}));

// ANN.searchbox ///////////////////////////////////////////////////////////////
(function(){ var self=ANN.searchbox={};
  
  self.init =
    function(){
      J('#searchbox input')
        .on('focus', self.events.input_focus)
        .on('keyup', self.events.input_keyup)
        .on('keydown', self.events.input_keydown)
        .on('blur', self.events.input_blur);
      J('#searchbox .search-suggest li')
        .on('mouseenter', self.events.suggest_hover_in)
        .on('mouseleave', self.events.suggest_hover_out)
        .on('click', self.events.suggest_click);
    };
  
  self.enlarge_textbox =
    function(){
      if (J.body.hasClass('mobile-mode-0')) {
        var offset = J('#searchbox form').position().left;
        var textwidth = J('#searchbox .measure')[0].scrollWidth;
        var boxwidth = offset + J('#searchbox input').width();
        var minimum = J('#searchbox').prev().width();
        offset = Math.max(Math.min(boxwidth - textwidth,0),-minimum);
        J('#searchbox form').css('left', offset+'px');
      }
      else
        J('#searchbox form').css('left', '0px');
    };
  
  self.set_search_type =
    function(elem){
      elem.addClass('selected').siblings().removeClass('selected');
      J('#searchbox form').attr('action', elem.attr('data-action'));
      J('#searchbox input').attr('name', elem.attr('data-param'));
    };
  
  self.events =
    {
      input_focus: function(){
        J('#searchbox form').addClass('active');
        self.enlarge_textbox();
      },
      input_keyup: function(event){
        J('#searchbox .search-suggest span').text(this.value);
        J('#searchbox .measure').text(this.value);
        self.enlarge_textbox();
      },
      input_keydown: function(event){
        var li = J('#searchbox .search-suggest li');
        var current = li.filter(".selected");
        switch (event.keyCode) {
          case 38: //arrow up
            var prev = current.prev();
            if (prev.length == 0) prev = li.last();
            self.set_search_type(prev);
            event.preventDefault();
            break;
          case 40: //arrow down
            var next = current.next();
            if (next.length == 0) next = li.first();
            self.set_search_type(next);
            event.preventDefault();
            break;
          case 27: //escape
            J('#searchbox input').blur();
        }
      },
      input_blur: function(){
        if (J('#searchbox li.hovering').length == 0){
          J('#searchbox form').removeClass('active');
          J('#searchbox form').css('left', '0px');
        }
      },
      suggest_hover_in: function(){
        J(this).addClass('hovering');
        self.set_search_type(J(this));
      },
      suggest_hover_out: function(){
        J(this).removeClass('hovering');
      },
      suggest_click: function(){
        if (J('#searchbox input').val().match(/\S/)){
          J('#searchbox form').submit();
        }
        J('#searchbox form').removeClass('active');
      }
    };
  
})();

// ANN.grid ////////////////////////////////////////////////////////////////////
(function(){ var self=ANN.grid={};
  
  self.view_mode = 'grid-thumb';
  
  self.init =
    function(){
      J('.herald a[data-track]').on('mouseup', function(ev){
        if (ev.which == 1 || ev.which == 2){
          J.ajax('/logger.herald?'+J(this).attr('data-track'));
        }
      });
      J.document.on('click', '.herald a[data-track][href=""]', function(e){
        e.preventDefault();
      });
      var box = J('.herald-boxes .box');
      self.box_padding = ANN.sum(box.css('padding-left'), box.css('padding-right'));
      self.boxes = box;
      self.mainfeed = J('#mainfeed');
      self.days = self.mainfeed.find('.mainfeed-day');
      self.aside = J('#aside');
      if (self.mainfeed.length == 0)
        self.mainfeed = null;
      else{
        self.view_modes_tried = [];
        self.track_id = (Math.random()+'').replace(/0\./,'');
        self.mainfeed.find('.view-mode div:not(.open-preferences)').click(function(){
          var was_grid = /grid/.test(self.view_mode);
          var mode = self.set_view_mode(this.className);
          var is_grid = /grid/.test(self.view_mode);
          //when going from grid->list reinit ads in order to properly set 'rfloat'
          if (was_grid && !is_grid) ANN.ads.insert_mainfeed_placeholders();
          if (!document.location.host.match(/^admin/)){ self.track(mode); }
        });
        self.mainfeed.find('.filters li').click(function(){
          self.toggle_filter(J(this));
        });
        
        var filters = ANN.user_preferences.get('grid_filters');
        for (var i = 0; i < filters.length; i++){
          self.mainfeed.find('.filters li[data-filter="' + filters[i] + '"]').addClass('selected');
        }
        
        self.apply_filters();
        
        var mode = ANN.user_preferences.get('mainfeed_viewmode');
        if (window.location.host.match(/^admin/)) mode = null;
        self.initial_mode = self.set_view_mode(mode || 'grid-thumb', true);
      }
    };
  
  self.track =
    function(mode){
      if (!self.mainfeed){ return; }
      self.view_modes_tried.push(mode);
      J.ajax('/cms/ann5/track_viewmode?i='+self.track_id+'&modes=('+self.initial_mode+')/'+self.view_modes_tried.join('/'));
    };
  
  self.set_view_mode =
    function(mode, do_not_set){
      if (!self.mainfeed) return;
      if (mode.match(/compact-list-text/)) mode = 'compact-list-text';
      else if (mode.match(/list-text/)) mode = 'list-text';
      else if (mode.match(/list-thumb/)) mode = 'list-thumb';
      else if (mode.match(/grid-text/)) mode = 'grid-text';
      else mode = 'grid-thumb';
      
      self.view_mode = mode;
      self.mainfeed.find('.view-mode .'+mode).addClass('selected').siblings().removeClass('selected');
      self.mainfeed.removeClass().addClass(mode.replace(/-/g,'-view ')+'-view');
      if (!do_not_set){ ANN.user_preferences.set('mainfeed_viewmode', mode); }
      self.clear_box_under_aside();
      ANN.lazyload.renew();
      
      return mode;
    };
  
  self.toggle_filter =
    function(li){
      var i;
      
      if (li.attr('data-filter') == '*' || li.attr('data-filter') == 'local'){
        li.addClass('selected').siblings().removeClass('selected');
        ANN.user_preferences.set('grid_filters', [li.data('filter')]);
      }
      else{
        var all = li.siblings('[data-filter="*"]');
        var grid_filters = ANN.user_preferences.get('grid_filters');
        
        li.toggleClass('selected');
        li.siblings('[data-filter="local"]').removeClass('selected');
        if (-1 !== (i = grid_filters.indexOf('local')))
          grid_filters.splice(i, 1);
        
        if (all.siblings('.selected').length === 0){
          all.addClass('selected');
          ANN.user_preferences.set('grid_filters', ['*']);
        }
        else{
          all.removeClass('selected');
          if (-1 !== (i = grid_filters.indexOf('*')))
            grid_filters.splice(i, 1); 
          
          if (li.is('.selected'))
            grid_filters.push(li.data('filter'));
          else if (-1 !== (i = grid_filters.indexOf(li.data('filter'))))
            grid_filters.splice(i, 1);
          
          ANN.user_preferences.set('grid_filters', grid_filters);
        }
      }
      self.apply_filters();
      //if some boxes were hidden reinit ads to ensure no more than one ad every 10 boxes
      ANN.ads.insert_mainfeed_placeholders();
    };
  
  self.apply_filters =
    function(){
      var li=J('#mainfeed .filters .selected');
      if (li.attr('data-filter') == '*'){
        J('#mainfeed .adtester-container').show();
        J('#load-more span').text('');
        self.boxes.removeClass('is-filtered');
      }
      else{
        J('#mainfeed .adtester-container').hide();
        J('#load-more span').text('('+li.map(function(){return this.innerText;}).get().join(', ')+')');
        var types=[], tags=J.map(li, function(x){return J(x).attr('data-filter')});
        while (tags.length && tags[0].match(/news|interest|reviews|column/)) types.push(tags.shift());
        types = new RegExp(types.length ? types.join("|") : ".");
        tags = new RegExp(tags.length ? tags.join("|") : ".");
        self.boxes.each(function(){
          var box = J(this);
          var topics = box.attr('data-topics') || "";
          var on = topics.match(types) && topics.match(tags);
          box.toggleClass('is-filtered', !on);
        });
      }
      
      self.days.each(function(){
        var div = J(this), h2 = div.find('h2.section-title');
        if (div.find('.mainfeed-section .box:visible').length > 0)
          h2.show();
        else
          h2.hide();
      });
      self.clear_box_under_aside();
      ANN.lazyload.renew();
      self.load_more(true);
    };
  
  self.set_mainfeed_width =
    function(){
      if (!self.mainfeed) return
      var l = ANN.layout;
      var w = l.state.width;
      var with_ad = 728 + l.main.current.padding;
      
      if (l.mode.mobile==0 && l.mode.gutter==2 && w.main_max > with_ad){
        w.main_max = Math.min(w.body * 0.84, w.main_max);
        w.main_max = Math.max(with_ad, w.main_max);
      }
      w.main_max = Math.min(w.main_max, (400 + self.box_padding)*5 + l.main.current.padding);
    };
  
  self.set_grid_mode =
    function(){
      var w = ANN.layout.state.width;
      
      var grid = Math.floor(ANN.layout.main.width() / (300 + self.box_padding));
      if (grid < 1) grid = 1;
      if (grid > 5) grid = 5;
      ANN.layout.mode.set('grid',grid);
      
      self.clear_box_under_aside();
    };
  
  self.clear_box_under_aside =
    function(){
      if (!self.mainfeed) return;
      var boxes = J('.mainfeed-section .box:visible').not('.iab');
      var col=1, nbcol=ANN.layout.mode.grid;
      J('.aside_overlap').removeClass('aside_overlap');
      if (self.view_mode.match(/list/)) return;
      if (nbcol == 1) return;
      if (self.mainfeed.height() < self.aside.height())
        J('#load-more').addClass('aside_overlap');
      for (var i=1; i<boxes.length; i++){
        if (boxes[i].offsetLeft <= boxes[i-1].offsetLeft)
          col = 1;
        else{
          col++;
          if (boxes[i].offsetTop > boxes[i-1].offsetTop){
            var b = J(boxes[i]);
            if (b.find('~ .box:visible').length > 0) b.addClass('aside_overlap');
            col = 1;
          }
        }
      }
    };
  
  var load_more_retry = 0;
  
  self.load_more =
    function(auto, reentrant){
      var more = J('#load-more');
      if (more.length==0) return;
      if (more.hasClass('busy') && !reentrant) return;
      
      if (auto && self.mainfeed.height() > screen.height*2) return more.removeClass('busy');
      if (auto && self.days.length >= 14) return more.removeClass('busy');
      
      var prevday = self.days.last().attr('data-prevday');
      if (prevday == '' && !auto) alert('nothing to load');
      if (prevday == '') return more.removeClass('busy');
      
      var nb_visible_boxes_before = self.boxes.not('.is-filtered').length;
      more.addClass('busy');
      J.ajax('/herald/hp_more?d='+prevday, {
        success: function(data, textStatus, jqXHR){
          self.mainfeed.append(data);
          self.days = self.mainfeed.find('.mainfeed-day');
          self.boxes = J('#mainfeed .herald-boxes .box');
          self.apply_filters();
          //boxes have been appended to mainfeed, so append ads as well
          ANN.ads.insert_mainfeed_placeholders(true);
          if (auto)
            self.load_more(auto, true);
          else{
            more.find('em').html(self.boxes.not('.aside').length+' articles;');
            more.removeClass('busy');
            
            if (self.boxes.not('.is-filtered').length == nb_visible_boxes_before) {
              load_more_retry++;
              if (load_more_retry <= 10) self.load_more(auto, true);
            }
            else{
              load_more_retry = 0;
              ANN.viewport.scroll_to(self.days.last());
            }
          }
        },
        error: function(){
          more.removeClass('busy');
        }
      });
    };
  
})();

// ANN.marquee /////////////////////////////////////////////////////////////////
(function(){ var self=ANN.marquee={};
  
  self.init =
    function(){
      var m = J('#marquee');
      if (m.length == 0) return;
      self.ratio = 'medium';
      self.items = m.find('.marquee-item');
      self.overlay_width = m.find('.overlay:visible').outerWidth();
      setTimeout(function(){ self.slide(); }, 1); //need 1ms delay otherwise css transitions don't work in Chrome
      setInterval(function(){ if (!self.paused && document.hasFocus()) self.slide(); }, 5000);
      
      m.children().hover(
        function(){ self.paused = true; },
        function(){ self.paused = false; }
      );
    };
  
  self.slide =
    function(prev){
      var m = J('#marquee');
      var c = m.find('.current.marquee-item');
      var n = prev ? c.prev('.marquee-item') : c.next('.marquee-item');
      if (n.length == 0) n = prev ? self.items.last() : self.items.first();
      c.removeClass('current');
      if (c.hasClass('from-bottom')) c.addClass('at-bottom');
      if (c.hasClass('from-top')) c.addClass('at-top');
      n.addClass('current');
      if (n.hasClass('from-bottom')) n.removeClass('at-bottom');
      if (n.hasClass('from-top')) n.removeClass('at-top');
    };
  
  self.ratio = 'normal';
  self.set_ratio =
    function(){
      if (!self.items) return;
      var c = self.items.filter(':visible');
      var total_height = c.height();
      var total_width = c.width();
      var free_width = total_width - self.overlay_width;
      var ratio;
      if (total_width < 840)
        ratio = 'narrow';
      else if (free_width < 900)
        ratio = 'medium';
      else
        ratio = 'wide';
      
      self.items.removeClass(self.ratio).addClass(ratio);
      self.items.find('div.cover-image').each(function(){
        J(this).find('.shading').toggle(parseInt(this.style.maxWidth) < total_width);
      });
      self.ratio = ratio;
    };
  
})();

// ANN.ads /////////////////////////////////////////////////////////////////////
(function(){ var self=ANN.ads={};
  
  self.pageinfo = {};
  var displayed_ads = {};
  
  self.init =
    function(){
      var c = '&c='+self.pageinfo.cookiename,
          top = J('.iab.top:visible').first(),
          side = J('.iab.side:visible').first();
      
      top.testing = side.testing = '';
      if (document.location.search.match(/now_testing_banner_id=([\d-.]+)/))
        top.testing = side.testing = '?now_testing_banner_id='+RegExp.$1;
      if (document.location.search.match(/now_testing_rect_id=([\d-.]+)/))
        side.testing = '?now_testing_banner_id='+RegExp.$1;
      self.testing = side.testing;
      
      if (ANN.ads.pageinfo.disable_ads && !top.testing && !side.testing){
        top.remove();
        side.remove();
        return;
      }
      
      self.pageinfo.mobile = ANN.layout.mode.mobile;
      self.pageinfo.url = document.location.href;
      self.pageinfo.maxW = top.width();
      if (self.adblocked) self.pageinfo.adblocked = true;
      if (ANN.layout.mode.skin) self.pageinfo.skin = true;
      
      //leaderboard
      if (ANN.layout.mode.mobile) //put 'side' rectangle ads at top
        if (ANN.layout.mode.skin || ANN.grid.mainfeed)
          top.remove(); //but not on the HP or when a skin is running
        else
          self.create_iframe(top.removeClass('top').addClass('side'), self.aframe_asset.replace(/_/,'1')+side.testing);
      else
        self.create_iframe(top, self.aframe_asset.replace(/_/,'0')+top.testing);
      
      //rectangle
      if (ANN.grid.mainfeed){
        if (side.length) {
          //insert rectangle ads dynamically
          side.remove();
          self.insert_mainfeed_placeholders();
          J.window.on('scroll', self.load_mainfeed_ads);
        }
        else {
          //not our ads in mainfeed (ex: Ezoic)
          self.insert_mainfeed_placeholders = function(){ };
        }
      }
      else if (ANN.layout.mode.mobile)
        side.remove();
      else
        self.create_iframe(side, self.aframe_asset.replace(/_/,'1')+side.testing);
      
      //owl ads
      if (ANN.layout.mode.mobile)
        J('.owl').remove();
      else{
        var owlurl = function(hash){ return '/assets/'+hash+'.gif#'+escape(document.location.href); };
        J('.owl.sidebar').append('<iframe src="'+owlurl('ea2fb4e1c41c6b16a37b5ef5ffd0a1d46ce178fb')+'" width="300" height="250" '+self.AD_IFRAME_ATTRIBUTES+'></iframe>');
        var owl = J('.owl.content');
        owl.append('<iframe src="'+owlurl('6fda10e070153d3dc5c9d2570e87e7d683479b8a')+'" width="300" height="250" '+self.AD_IFRAME_ATTRIBUTES+'></iframe>');
        if (owl.width() >= 610)
          owl.append('<iframe src="'+owlurl('429b6b9588cc55af77b1eb1304aca15ea6f99c1b')+'" width="300" height="250" '+self.AD_IFRAME_ATTRIBUTES+'></iframe>');
      }
      
      J.window.on('message', function(ev){
        var m;
        ev = ev.originalEvent;
        if (ev.origin == document.location.origin){
          if (m=ev.data.ad_finished_loading) self.ad_finished_loading(m);
          if (m=ev.data.displaying_ad) self.displaying_ad(m);
        }
        if (m=ev.data.ad_fallback_for) self.ad_fallback_for(m);
      });
    };
  
  var mainfeed_ad_placeholders = [];
  var mainfeed_ads = [];
  var ad_insertion_point = 1;
  
  self.insert_mainfeed_placeholders =
    function(append){
      var boxes = J('.mainfeed-section .herald.box:visible');
      var box, container;
      if (!append) {
        while (box = mainfeed_ad_placeholders.pop()||mainfeed_ads.pop()) box.remove();
        ad_insertion_point = 1;
      }
      while (box=boxes.get(ad_insertion_point)) {
        container = J('<div class="box iab side"><div></div></div>');
        container.insertAfter(box);
        mainfeed_ad_placeholders.push(container);
        ad_insertion_point += ANN.layout.mode.grid<=2 ? 10 : 15;
      }
      ANN.grid.clear_box_under_aside();
      self.load_mainfeed_ads();
    };
  
  self.load_mainfeed_ads =
    function(){
      var i=0, container;
      while (container=mainfeed_ad_placeholders[i]) {
        var ofs = ANN.viewport.offset(container[0]);
        if (ofs < 0 || ofs === null)
          i++;
        else if (ofs > 500)
          break;
        else {
          mainfeed_ad_placeholders.splice(i,1);
          mainfeed_ads.push(container);
          container.toggleClass('rfloat', container.prev().width() > 630);
          self.create_iframe(container, self.aframe_asset.replace(/_/,'1')+self.testing);
        }
      }
    };
  
  self.create_iframe =
    function(container, src){
      if (self.adblocked) return;
      ANN.set_cookie(self.pageinfo.cookiename+'@', JSON.stringify(self.pageinfo), 10);
      var ad_spot;
      while (!ad_spot || ad_spot in displayed_ads)
        ad_spot = Math.random().toString(16).replace("0.","").slice(0,5);
      src = src.replace(/~~~~~/, ad_spot);
      displayed_ads[ad_spot] = { container: container };
      container.find('div').first().html('<iframe src="'+src+'" '+self.AD_IFRAME_ATTRIBUTES.replace(/sandbox=".*?"/,'')+'></iframe>');
    };
  
  self.displaying_ad =
    function(ad){
      ANN.debug.msg('displaying_ad', ad);
      var current = displayed_ads[ad.ad_spot];
      if (current){
        ad = J.extend(current, ad);
        self.set_sponsor(ad.container, ad.ad_type, ad.sponsor_name, ad.sponsor_id, ad.width, ad.height, ad.id, ad);
      }
    };
  
  self.set_sponsor =
    function(container, ad_type, name, sponsor_id, w, h, ad_id, ad){
      if (!ad_id){
        if (ad_type == 'BANNER'){
          //if on load the page is scrolled to a certain point (e.g. /faq#story_idea)
          //we must not hide the banner because that would change window.scrollTop
          var ct = container.offset().top, wt = J.window.scrollTop();
          if (ct < wt) return;
        }
        container.css('height',0);
      }
      else if (w && h){
        var div = container.find('div');
        div.css('width', w);
        container.find('iframe').css('height', h);
        var small = div.find('small');
        if (!small.length) small = div.append('<small></small>').find('small');
        small.html('Ad by '+name);
        small.append(' • <span>report</span>');
        small.find('span:eq(0)').click(function(){ self.report(name, sponsor_id, ad_id, ad_type, ad); });
        if (self.allow_block){
          small.append(' • <span>block</span>');
          small.find('span:eq(1)').click(function(){ self.block(name, sponsor_id); });
        }
        container.css('height', div.outerHeight(true));
      }
      if (ad_type == "RECT")
        setTimeout(ANN.grid.clear_box_under_aside, 500);
    };
  
  self.ad_finished_loading =
    function(ad){
      ANN.debug.msg('ad_finished_loading', J.extend({},ad,{html_contents:"..."}));
      var current = displayed_ads[ad.ad_spot];
      if (current && current.id == ad.id){
        current.html_contents = ad.html_contents;
      }
    };
  
  self.ad_fallback_for =
    function(ad){
      ANN.debug.msg('ad_fallback_for', ad);
      var current = displayed_ads[ad.ad_spot];
      if (!current) return; //fallback is already loading
      if (ad.id && ad.id != current.id) return; //mismatch: trying to load fallback for different ad than current one
      if (self.testing) return current.container.after('<center>^ invoked fallback ^</center>'); //no fallback when testing
      if (current.no_fallback){
        //hide the ad iframe
        ANN.debug.msg('load fallback', false);
        self.displaying_ad({ad_spot: ad.ad_spot, id: null});
      }
      else{
        //load a fallback
        ANN.debug.msg('load fallback', true);
        displayed_ads[ad.ad_spot] = null;
        self.create_iframe(current.container, '/fallback.aframe?b='+current.id+'-'+current.campaign_id+'-'+current.time+'&c='+self.pageinfo.cookiename+'&p=~~~~~');
      }
    };
  
  self.report =
    function(sponsor_name, sponsor_id, ad_id, ad_type, ad){
      if (ad.reported) return alert('You already reported this ad.');
      var html = ad.html_contents,
          msg = navigator.userAgent.match(/MSIE|Trident/) ? '' :
            'ANN does not allow ads that...\n'+
            '• contain sexually explicit or otherwise "not safe for work" images\n'+
            '• open pop-ups, pop-unders, overlays, play sound on load or hover, etc.\n'+
            '• advertise bootlegs, fansubs, unauthorized streaming sites or other forms of piracy\n'+
            '\n';
      msg += 'To file a complaint about this ad from '+sponsor_name+', please leave a message below.';
      if (html.match(/cannot access contents of \w+:/))
        msg += '\nIn particular, tell us what text and urls are written in the ad.';
      var complaint = prompt(msg, '');
      if (complaint != null){
        J.ajax('/ad/complaint/new!', {
          data: {message: complaint, sponsor_id: sponsor_id, banner_id: ad_id, html: html},
          type: "POST",
          dataType: "html",
          error: ANN.notifications.generic_error_handler,
          success: function(data, textStatus, jqXHR){
            ANN.notifications.notice(data);
            ad.reported = true;
          }
        });
      }
    };
  
  self.block =
    function(sponsor_name, sponsor_id){
      if (self.allow_block){
        if (confirm('Block all ads from '+sponsor_name+'?')){
          J.ajax('/my/subscription/turn_off!', {
            data: {advertiser: sponsor_id},
            type: "POST",
            dataType: "html",
            error: ANN.notifications.generic_error_handler,
            success: function(data, textStatus, jqXHR){
              var div = container.find('div').first();
              div.empty().append(data);
              container.css('height', div.outerHeight(true));
            }
          });
        }
      }
      else{
        if (confirm('Only subscribers can block ads.\nSubscribe? (from 3$/month)')){
          window.open('/subscription', '_blank');
        }
      }
    };
  
  self.adblocked =
    function(iab_div, width, height, url){
      //do something eventually
    };
  
  self.shuffle_attr =
    function(list){
      if (typeof list == 'string') list = list.match(/\S.*?;/g) || [];
      var attr = '';
      while (list.length){
        var idx = Math.floor(Math.random()*list.length);
        var str = list.splice(idx,1)[0];
        while (Math.random() < 0.618) str = str.replace(/: /,':  ');
        while (Math.random() < 0.618) str = ' '+str;
        attr += str;
      }
      return attr;
    };
  
})();

// ANN.quicknav ////////////////////////////////////////////////////////////////
(function(){ var self=ANN.quicknav={};
  
  self.popup =
    function(span){
      span = J(span);
      var li = span.parent().parent(),
          ul = li.parent(),
          above = li.prev().length,
          below = li.nextAll().find('h4').length,
          nothing = (li.attr('data-quicknav') == '0'),
          only = (!above && !below && ul.hasClass('colspan2of3')),
          has_links = li.next().find('a').length > 0,
          menu = span.next();
          
      if (menu.length == 0){
        menu=span.after(
          '<div class="qn-menu off">'+
            (nothing ? 'Customize the ANN menu with the links you want; commonly<br>accessed pages, or useful pages not found in the menu, etc.<br><br>' : '')+
            '<div>add current page</div>'+
            '<div>edit links</div>'+
            '<div>rename this category</div>'+
            '<div>delete this category</div>'+
            '<div>add a category</div>'+
            (only ? '' : 'move<span>←</span><span>↑</span><span>↓</span><span>→</span>')+
          '</div>'
        ).next();
        menu.find('div:eq(0)').click(self.event(self.add_link));
        menu.find('div:eq(1)').click(self.event(self.edit_links));
        menu.find('div:eq(2)').click(self.event(self.rename));
        menu.find('div:eq(3)').click(self.event(self.delete_nav));
        menu.find('div:eq(4)').click(self.event(self.add_category));
        menu.find('span:eq(0)').click(self.event(self.move,"left"));
        menu.find('span:eq(1)').click(self.event(self.move,"up"));
        menu.find('span:eq(2)').click(self.event(self.move,"down"));
        menu.find('span:eq(3)').click(self.event(self.move,"right"));
      }
      
      menu.find('div:eq(1)').toggleClass('inactive', !has_links);
      menu.find('div:eq(3)').toggleClass('inactive', has_links || nothing);
      
      menu.find('span:eq(0)').toggleClass('inactive', ul.prev().length==0);
      menu.find('span:eq(1)').toggleClass('inactive', !above);
      menu.find('span:eq(2)').toggleClass('inactive', !below);
      menu.find('span:eq(3)').toggleClass('inactive', !(ul.next().next().length||above||below));
      
      ANN.toggle(menu);
      span.closest('div.menu').find('>div').addClass('overflow-ok');
    };
  
  self.event =
    function(fn, param){
      return function(){
        if (J(this).hasClass('inactive')) return;
        var li = J(this).parents('.quicknav').first();
        var c = li.find('h4').length;
        fn(li, c ? "category" : "link", param);
        if (c) ANN.toggle(this.parentNode);
      };
    };
  
  self.add_link =
    function(li){
      var txt = J('title').text().split(/( - )?Anime News Network/)[0];
      txt = prompt('Add the current page to your quicknav as:', txt);
      if (txt && txt.match(/\S/)){
        self.post('new!', {
          category: li.attr('data-quicknav'),
          name: txt,
          url: document.location.href
        })
      }
    };
  
  self.edit_links =
    function(category){
      var next_category = category.nextAll().find('h4').parent();
      var links = category.nextUntil('.category');
      links.each(function(){
        if (J(this).find('.qn-menu').length==0) J(this)
          .append('<div class="qn-menu on"><span>rename</span><span>delete</span><span>↑</span><span>↓</span></div>')
          .find('.qn-menu span')
          .first().click(self.event(self.rename))
          .next().click(self.event(self.delete_nav))
          .next().click(self.event(self.move,"up"))
          .next().click(self.event(self.move,"down"));
      });
      links.toggleClass('editing');
      links.find('span').removeClass('inactive');
      links.first().find('.qn-menu span:eq(2)').addClass('inactive');
      links.last().find('.qn-menu span:eq(3)').addClass('inactive');
    };
  
  self.rename =
    function(li, type){
      var txt = prompt('Rename this quicknav '+type+':', li.find('span,a').first().text());
      if (txt && txt.match(/\S/)){
        self.post('edit!', { name: txt, id: li.attr('data-quicknav') });
      }
    };
  
  self.delete_nav =
    function(li, type){
      if (confirm('delete this quicknav '+type+'?')){
        self.post('delete!', { id: li.attr('data-quicknav') });
      }
    };
  
  self.add_category =
    function(li){
      var txt = prompt('Add a quicknav category:');
      if (txt && txt.match(/\S/)){
        self.post('new!', { name: txt });
      }
    };
  
  self.move =
    function(li, type, dir){
      self.post('move!', { id: li.attr('data-quicknav'), dir:dir });
    };
  
  self.post =
    function(url, data){
      J.ajax('/account/quicknav/'+url, {
        data: data,
        type: "POST",
        dataType: "html",
        success: function(data, textStatus, jqXHR){
          var nav = J('#mega .user.menu nav');
          nav.children().not('.system').remove();
          nav.prepend(data);
          ANN.mega_nav.adjust_height();
        },
        error: ANN.notifications.generic_error_handler
      });
    };

})();

// ANN.images //////////////////////////////////////////////////////////////////
(function(){ var self=ANN.images={};
  
  self.init =
    function(){
      J('.image-list div[data-properties]').each(function(){
        self.init_image(J(this), JSON.parse(J(this).attr('data-properties')));
      });
      J('.image-list ins input[type="file"]')
        .change(self.upload)
        .closest('ins')
        .wrap('<form/>');
    };
  
  self.init_image =
    function(div, file){
      if (!file.width){
        var img = div.hide().append('<img>').find('img');
        if (!file.id) file.id = file.path;
        img.attr('src', file.path).imagesLoaded(function(){
          if (!img[0].naturalWidth) return;
          file.width = img[0].naturalWidth;
          file.height = img[0].naturalHeight;
          file.focal_position = 'center';
          img.remove();
          div.show();
          self.init_image(div, file);
        });
        return;
      }
      var imageprefix = div.closest('.image-list').find('[name="imageprefix"]');
      div[0].file_properties = file;
      div.attr('data-path', file.path);
      div.css('background', 'url('+file.path.replace(/images/,'thumbnails/cover140x80')+') no-repeat '+file.focal_position);
      div.css('background-size', 'cover');
      div.click(function(){ self.choose_file(div, file); });
      var details = '<span>'+file.basename+'</span>';
      details += '<br><span>('+file.width+'x'+file.height+')</span>';
      J(details).appendTo(div);
      if (imageprefix.length){
        J('<del>&#x2718;</del>')
          .appendTo(div)
          .click(function(ev){ ev.stopPropagation(); self.delete_file(file,imageprefix.val()); });
      }
    };
  
  self.upload =
    function(){
      var input = J(this),
          mime = this.files[0].type,
          form = this.form,
          progress = J('<progress/>');
      
      if (!mime.match(/image\/(jpeg|gif|png)/)){
        form.reset();
        return alert('Uploaded file must be a jpeg/gif/png image');
      }
      input.after(progress);
      var formData = new FormData(form);
      J.ajax({
        url: '/image/upload!',
        type: 'POST',
        // Ajax events
        success: function(data){ form.reset(); progress.remove(); self.add_file(data, input); },
        error: function(){ form.reset(); progress.remove(); alert('upload error'); },
        // Form data
        data: formData,
        contentType: false,
        processData: false
      });
    };
  
  self.add_file =
    function(file, input){
      var imagelist = input.closest('.image-list');
      var removed = J('.image-list').find('div[data-path="'+file.path+'"]').remove();
      var div = J('<div/>').appendTo(imagelist);
      self.init_image(div, file);
      self.choose_file(div, file);
    };
  
  self.choose_file =
    function(div, file){
      function callback(){
        self.choose_file.dblclick = null;
        if (self.onSelect)
          if (self.onSelect(div, file) === false)
            return;
        J('.image-list .selected').removeClass('selected');
        div.addClass('selected');
      }
      if (self.choose_file.dblclick || file.focal_position.match(/center/)){
        clearTimeout(self.choose_file.dblclick);
        ANN.modal("/image/focal_area?id="+file.id, file, callback, self.onOpen);
      }
      else
        self.choose_file.dblclick = setTimeout(callback, 300);
    };
  
  self.delete_file =
    function(file, imageprefix){
      if (confirm('Delete '+file.path+' ?')){
        J.ajax({
          type: 'POST',
          url: '/image/delete!',
          data: { id:file.id, imageprefix:imageprefix },
          success: function(data){
            J('.image-list').find('div[data-path="'+file.path+'"]').remove();
          },
          error: function(){ alert('cannot delete'); }
        });
      }
    };
  
  self.focal_area = {};
  
  self.focal_area.init =
    function(){
      J('.init.focal_area').each(function(){
        var new_area = {};
        var focal_area = J(this).removeClass('init');
        var file = focal_area.closest('.modal-window')[0].data;
        focal_area.find('button')
          .last()
            .click(ANN.modal.close)
          .end()
          .first()
            .prop("disabled", true)
            .click(function(){
              self.focal_area.save(focal_area, file, new_area);
            });
        
        var img = focal_area.find('img').first();
        var opt = {
          instance: true,
          imageWidth: file.width,
          imageHeight: file.height,
          onSelectEnd: function(img,area){
            if (area.width == 0){
              var xP = area.x1 / file.width;
              area.width = Math.min(file.width, file.height) * 0.6;
              area.x1 = xP * (file.width - area.width);
              area.x2 = area.x1 + area.width;
            }
            if (area.height == 0){
              var yP = area.y1 / file.height;
              area.height = Math.min(file.width, file.height) * 0.6;
              area.y1 = yP * (file.height - area.height)
              area.y2 = area.y1 + area.height;
            }
            if (xP || yP){
              self.focal_area.api.setSelection(area.x1, area.y1, area.x2, area.y2);
              self.focal_area.api.setOptions({ show: true });
              self.focal_area.api.update();
            }
            J.extend(new_area, area);
            self.focal_area.set(focal_area, file, new_area);
          },
          handles: true,
          parent: focal_area
        };
        if (file.width >= 900 && file.height >= 350 && file.width > file.height){
          opt.maxHeight = file.width * 350 / 900;
        }
        if (file.focal_area) {
          J.extend(opt, file.focal_area);
          J.extend(new_area, file.focal_area);
          new_area.width = new_area.x2 - new_area.x1;
          new_area.height = new_area.y2 - new_area.y1;
          self.focal_area.set(focal_area, file, new_area);
        }
        self.focal_area.api = img.imgAreaSelect(opt);
      });
    };
  
  self.focal_area.set =
    function(focal_area, file, area){
      function PCT(n){ return Math.round(1000*n)/10+'%'; }
      var xP = area.x1 / (file.width - area.width) * 100;
      var yP = area.y1 / (file.height - area.height) * 100;
      focal_area.find('button').first().prop("disabled", isNaN(xP)||isNaN(yP));
      if (isNaN(xP)) xP = 50;
      if (isNaN(yP)) yP = 50;
      focal_area.find('.example div').css('background-position', xP+'% '+yP+'%');
      var e = focal_area.find('.example.wide-marquee').first();
      if (e.length){
        //limit width so that scaled focal area never grows beyond 350px height
        var div = e.find('div'),
            span = e.find('span'),
            scale = parseInt(div.css('height')) / 350,
            w = span[0].w = span[0].w || parseInt(span.text()),
            w_ratio = file.width / w,
            h_ratio = (area.y2 - area.y1) / (350 * w_ratio),
            msg = '';
        if (h_ratio > 1){
          if (w_ratio > 1) msg = "Even after the picture is scaled to "+PCT(1/w_ratio)+" ("+span[0].w+"px width), the focal area is still "+Math.round(area.height/w_ratio)+"px tall; at that scale it won't fit in the 350px height of the marquee, ";
          else msg = "The focal area is "+area.height+"px tall; at full scale it won't fit in the 350px height of the marquee, ";
          w = Math.round(w / h_ratio);
          if (w >= 900)  msg += "so the image will be limited to "+PCT(w/file.width)+" scale to ensure the entire focal area is visible.";
          else msg += "but at "+PCT(w/file.width)+" scale the width would be smaller than 900px. So the image will be limited to "+PCT((w=900)/file.width)+" scale to ensure marquee width while maximizing how much of the focal area is visible.";
        }
        span.css('color', msg=='' ? '' : 'red').attr('title', msg);
        div.css('width', Math.floor(w*scale)+'px');
        span.text(w);
        var h = focal_area.outerHeight();
        focal_area.parent().height(h).parent().height(h);
      }
    };
  
  self.focal_area.save =
    function(focal_area, file, new_area){
      J.ajax({
        type: 'POST',
        url: '/image/focal_area!',
        data: { id:file.id, focal_area:new_area },
        success: function(data){
          J.extend(file, data);
          J('.image-list [data-path="'+file.path+'"]')
            .css('background-position', file.focal_position)
            .css('background-size', 'cover');
          ANN.modal.close(focal_area);
        },
        error: function(){ alert('cannot save'); }
      });
    };
  
})();

// ANN.lazyload ////////////////////////////////////////////////////////////////
(function(){ var self=ANN.lazyload={};
  
  var sidebar, mainfeed, other;
  
  self.init =
    function(){
      J.window.on("load scroll resize", self.load_in_view);
      setTimeout(self.load_in_view, 1000);
      if (!sidebar) self.renew();
    };
  
  function pick(selector, init){
    var elements = J(selector).get();
    var result = [];
    init = !!init;
    for (var i=0; i<elements.length; i++){
      if (elements[i].pickme) result.push(elements[i]);
      elements[i].pickme = init;
    }
    return result;
  }
  
  self.renew =
    function(){
      pick('.lazyload:visible', true);
      pick('.text-view .lazyload');
      if (ANN.grid.mainfeed){
        sidebar = pick('#aside .lazyload');
        mainfeed = pick('.mainfeed-day .lazyload');
      }
      else{
        sidebar = pick('#sidebar .lazyload');
        mainfeed = [];
      }
      other = pick('.lazyload');
      self.load_in_view();
    };
  
  self.load_in_view =
    function(){
      while (self.load_image(mainfeed[0])) mainfeed.shift();
      while (self.load_image(sidebar[0])) sidebar.shift();
      while (self.load_image(other[0])) other.shift();
    };
  
  function cdn(src){
    if (src.match(/^\/\w/))
      return window.location.origin.replace(/\/\/\w+\./,'//cdn.') + src;
    else
      return src;
  }
  
  self.load_image =
    function(elem){
      if (!elem) return false; //no image
      if (!elem.className.match(/lazyload/)) return true; //already loaded
      if (ANN.viewport.offset(elem) > 200) return false; //200px below the fold
      elem = J(elem);
      
      var src = cdn(elem.data("src")),
          srcset = elem.data("srcset");
      
      if (elem.is('img')) {
        if (src) elem.prop("src", src);
        if (srcset) elem.prop("srcset", srcset);
      }
      else {
        if (src) elem.css("background-image", "url(" + src + ")");
      }
      
      elem.removeClass('lazyload');
      return true;
    };
  
})();

// ANN.infinite_scroll /////////////////////////////////////////////////////////
(function(self){
  self.articles = {
    _all: [],
    requesting: true,
    init: function(){
      var $metadata = get_last_$metadata();
      var article = $metadata.data('article');
      article.get_end = get_end_function($metadata);
      this._all.push(this.first = article);
      this.process_metadata();
    },
    all: function(){
      return this._all.sort(function(record_a, record_b){
        return record_a.date_posted - record_b.date_posted;
      });
    },
    displayed: function(){
      var records = this.all().filter(function(record){
        return !record.is_skipped && record.get_end;
      });
      records.splice(records.indexOf(this.first), 1);
      records.push(this.first);
      return records;
    },
    enqueued: function(){
      return this.all().filter(function(record){
        return !record.is_skipped && !record.get_end;
      });
    },
    find: function(id){
      return this._all.find(function(record){ return record.id === id; });
    },
    current: function(){
      var window_end = J.window.innerHeight() + J.window.scrollTop();
      var articles = this.displayed();
      var start = 0;
      
      while (articles.length > 0){
        var is_last = articles.length === 1;
        var article = articles.pop();
        var end = article.get_end();
        if (window_end >= start && (is_last || window_end <= end)){
          return article;
        }
        else{ start = end; }
      }
    },
    next_to_display: function(){
      var article = this.enqueued().pop();
      article.is_skipped = (
        /main-feed/.test(self.url) &&
        article.is_news !== self.articles.first.is_news &&
        !ANN.user_preferences.get('infinite_scroll_mix_news_and_interest')
      )
      return article;
    },
    display_next: function(){
      if (
        !ANN.user_preferences.get('infinite_scroll') ||
        !this.requesting ||
        ANN.viewport.offset(self.$outlet[0]) > 200 ||
        ANN.sidebar.minimized
      ){ return; }
      
      this.requesting = false;
      self.$outlet.height(J.window.innerHeight());
      
      var article = self.articles.next_to_display();
      while (article && article.is_skipped)
        article = self.articles.next_to_display();
        
      // NOTE: if enqueued.empty?, display_next is permanently disabled
      if (!article){ self.status = 'stopped'; return; }
      
      J.get(self.url + '/' + article.id).done(function(html){
        html = J(html).addClass('infinite-scroll-item');
        try{ self.$outlet.before(html); } catch (e){ console.error(e); }
        
        // NOTE: workaround for css transitions. since it takes a while before an
        //  element goes live after being added to the dom, css transitions do not
        //  work. delaying the addClass should allow transitions to work
        html.delay(1).queue(function(){
          html.addClass('infinite-scroll-item--inserted').dequeue();
        });
        
        article.get_end = get_end_function(get_last_$metadata());
        self.articles.process_metadata();
        ANN.lazyload.renew();
        self.$outlet.height(0);
        self.articles.reenable_and_reattempt_to_display_next();
      }).fail(function(){
        setTimeout(self.articles.reenable_and_reattempt_to_display_next, 5000);
      });
    },
    reenable_and_reattempt_to_display_next: function(){
      self.articles.requesting = true;
      self.articles.display_next();
    },
    process_metadata: function(){
      var articles = get_last_$metadata().data('articles');
      while (articles.length > 0){
        var article = articles.pop();
        if (!this.find(article.id)){ this._all.push(article); }
      }
    }
  };
  
  self.init =
    function(){
      var $metadata = get_last_$metadata();
      if ($metadata.length === 0){ return; }
      
      self.url = $metadata.data('url');
      self.$outlet = J('#infinite-scroll-outlet');
      
      self.articles.init();
      
      // connect event handlers
      J.window.scroll(self.observe_and_update_page);
      J.window.resize(self.observe_and_update_page);
      
      self.observe_and_update_page();
      self.status = 'running';
    };
  
  self.observe_and_update_page =
    function(){
      self.update_page_history();
      self.articles.display_next();
    };
  
  self.update_page_history =
    function(){
      var current = self.articles.current();
      if (!self.articles.previous){ self.articles.previous = current; }
      else if (self.articles.previous.id === current.id){ return; }
      
      history.replaceState({}, current.title, current.url);
      document.title = current.title;
      self.articles.previous = current;
    };
  
  function get_last_$metadata(){ return J('.infinite-scroll-metadata:last'); }
  
  function get_end_function($metadata){
    return function(){
      var window_start = J.window.scrollTop();
      var distance_from_viewport_top_to_metadata =
        $metadata[0].getBoundingClientRect().top;
      var allowance = 0.5 * J.window.innerHeight();
      return window_start + distance_from_viewport_top_to_metadata + allowance;
    };
  }
  
}(ANN.infinite_scroll = {}));

// ANN.user_preferences ////////////////////////////////////////////////////////
(function(self){
  
  self.init =
    function(){
      var $initializer = J('[data-user-preferences-initializer]').remove();
      self.namespace = $initializer.data('user-preferences-namespace');
      self.server_list = $initializer.data('user-preferences-server-list');
      self.no_infolinks = $initializer.data('user-preferences-no-infolinks');
      self.user_is_signed_in = self.namespace !== "";
      self.changes = {};
      load_client_list();
      
      // ensure profile_name doesn't use cookie values
      ANN.delete_cookie(self.namespace + 'user_preferences_profile_name@');
      self.ui.init();
    };
  
  // function that returns profile THAT WAS INITIALLY SET ON PAGE LOAD
  self.get_profile =
    function(){
      return self.view('profile_name').profile;
    };
  
  // function that returns profile THAT IS CURRENTLY USED ON ALL PAGES
  self.get_current_profile =
    function(){
      // NOTE: user_preferences_profile and user_preferences_profile_name differ
      // profile = is the profile itself/the "profile id". not part of the schema.
      // profile_name = treated as a normal param in schema, EXCEPT the cookie value (per_device) cannot/should not be used
      var profile = ANN.get_cookie(self.namespace + 'user_preferences_profile@');
      profile = profile || ANN.layout.mode.device;
      return profile;
    };
  
  // function that detects if the INITIALLY-SET-PROFILE is not being used anymore
  self.profile_has_changed =
    function(){
      return self.get_profile() !== self.get_current_profile();
    };
  
  // function that returns a merge of server_list, client_list, and "cookie_list (via ANN.get_cookie)"
  self.list =
    function(){
      var list = {};
      for (var param in self.server_list){ list[param] = self.view(param); }
      return list;
    };
  
  // functions that return: {profile, value}
  self.view =
    function(param){
      // per_device
      var value = self.server_list[param].is_local_only
          ? self.client_list[param]
          : ANN.safe_parse_json(ANN.get_cookie(self.namespace + param + '@'));
      if (value !== undefined){
        if (is_valid_change(param, value)){ //ensure local value has expected type
          var descriptor = { profile: 'per_device', value: value };
          return J.extend({}, self.server_list[param], descriptor);
        }
      }
      
      // all OR current profile OR default OR schema default
      return J.extend({}, self.server_list[param]); // return clone instead
    };
  
  self.change =
    function(param, profile, value){
      if (!is_valid_change(param, value)){ return; }
      
      if (param === 'profile_name' && profile !== self.get_profile())
        throw new Error("Cannot change variable 'profile' for param 'profile_name'!");
      if (!(param in self.server_list))
        throw new Error("'" + param + "' is not a known 'param'!");
      
      return self.changes[param] = { profile: profile, value: value };
    };
  
  // function that persists values
  self.save =
    function(){
      for (var param in self.changes){
        persist_change_in_client(param, self.changes[param]);
        clear_change_if_local(param);
      }
      persist_changes_in_server();
    };
  
  // function that clear queued changesets
  self.clear_changes =
    function(){
      self.changes = {};
    };
  
  // functions that return: value
  self.get =
    function(param){
      return self.view(param).value;
    };
  
  self.set =
    function(param, value){
      var profile = self.view(param).profile;
      if (!profile || profile === 'default'){ profile = self.get_profile(); }
      if (is_valid_change(param, value)){
        self.clear_changes();
        self.change(param, profile, value);
        self.save();
      }
      return value;
    };
  
  // helpers
  // -- sub-functions of self.save
  function persist_change_in_client(param, descriptor){
    // NOTE: infolinks is a legacy preference, thus is handled differently
    if (param === 'no_infolinks'){ return; }
    
    var profile = descriptor.profile;
    var value = descriptor.value;
    
    // NOT per_device
    if (profile !== 'per_device'){
      // remove per_device
      remove_per_device(param);
      
      // persist to server_list
      self.server_list[param].profile = profile;
      self.server_list[param].value = value;
      return;
    }
    // per_device: local only
    if (self.server_list[param].is_local_only){
      self.client_list[param] = value;
      save_client_list();
      return;
    }
    // per_device: local and server
    ANN.set_cookie(self.namespace + param + '@', JSON.stringify(value));
  }
  
  function remove_per_device(param, client, cookie){
    // remove per_device: local only
    if (client !== false && self.client_list.hasOwnProperty(param)){
      delete self.client_list[param];
      save_client_list();
    }
    // remove per_device: local and server
    if (cookie !== false){
      ANN.delete_cookie(self.namespace + param + '@');
    }
  }
  
  function clear_change_if_local(param){
    if (self.changes[param].profile === 'per_device'){ delete self.changes[param]; }
  }
  
  function persist_changes_in_server(){
    if (!self.user_is_signed_in){ self.clear_changes(); return; }
    if (!infolinks_has_changed() && Object.keys(self.changes).length === 0){ return; }
    
    // NOTE: infolinks is a legacy preference, thus is handled differently
    var data = {};
    if (infolinks_has_changed()){
      self.no_infolinks = self.change_no_infolinks;
      data.no_infolinks = self.change_no_infolinks;
    }
    data.list = JSON.stringify(self.changes);
    self.clear_changes();
    
    J.ajax({
      type: 'POST',
      url: '/account/preferences!',
      data: data,
      dataType: 'json'
    });
  }
  
  // -- functions that save or load the client list
  function save_client_list(){
    localStorage.setItem(
      self.namespace + 'user_preferences', JSON.stringify(self.client_list)
    );
  }
  
  function load_client_list(){
    var json = localStorage.getItem(self.namespace + 'user_preferences');
    self.client_list = ANN.safe_parse_json(json) || {};
    prune_unused_params_in_client_list();
    update_locality_of_params();
  }
  
  // -- function that removes params that were removed from the previous schema
  function prune_unused_params_in_client_list(){
    for (var param in self.client_list){
      if (!self.server_list[param]){
        remove_per_device(param);
      }
    }
  }
  
  // -- function that prunes the values of params in cookies or localStorage
  // --   - a param value is pruned when they switch from local_only to local_and_server, vice versa
  // --   - local_only->local_and_server OR local_and_server->local_only
  function update_locality_of_params(){
    for (var param in self.server_list){
      if (self.server_list[param].is_local_only)
        remove_per_device(param, false, true);
      else
        remove_per_device(param, true, false);
    }
  }
  
  // -- function that checks type-validity of the value in self.change
  function is_valid_change(param, value){
    var type = self.server_list[param].type;
    if (type === 'array' && value instanceof Array){ return true; }
    if (typeof value === type){ return true; }
    
    console.error('ANN.user_preferences: expected "' + type + '" for "' + param + '" param. Got:', value);
    return false;
  }
  
  // -- function that indicates if infolinks has changed
  function infolinks_has_changed(){
    return self.user_is_signed_in && self.no_infolinks !== self.change_no_infolinks;
  }
  
}(ANN.user_preferences = {}));

// ANN.user_preferences.ui /////////////////////////////////////////////////////
(function(self){
  
  var up = ANN.user_preferences;
  
  self.init =
    function(){
      self.is_modal = J('.user-preferences').length === 0;
      J.document.on('click', '[data-user-preferences-action-open]', self.open)
                 .on('click', '[data-user-preferences-action-show-more]', self.show_more)
                 .on('click', '[data-user-preferences-action-close]', self.close)
                 .on('shown.ann5.modal', '.modal-window', self.init_form_values)
                 .on('click', '[data-user-preferences-form] .view-mode > div', select_mainfeed_viewmode)
                 .on('click', '[data-user-preferences-add-profile]', self.add_profile)
                 .on('click', '[data-user-preferences-delete-profile]', self.delete_profile)
                 .on('submit', '[data-user-preferences-form]', self.save);
      if (!up.user_is_signed_in){ J.document.on('change', '[data-user-preferences-form] .profile', self.alert_to_register); }
      if (!self.is_modal){ J('.open-preferences').hide(); }
      self.init_form_values(true);
    };
  
  self.init_form_values =
    function(outside_modal){
      if (J('[data-user-preferences-form]').length === 0){ return; }
      if (!outside_modal && J('.modal-window [data-user-preferences-form]').length === 0){ return; }
      
      if (!up.user_is_signed_in)
        J('[data-user-preferences-form] .profile > option[value="per_device"]').prop('selected', true);
      
      init_user_preference('profile_name');
      custom_init_for_mainfeed_viewmode();
      custom_init_for_grid_filters();
      custom_init_for_easyread_text_width();
      custom_init_for_infinite_scroll();
      init_user_preference('infinite_scroll_mix_news_and_interest', 'boolean');
      init_user_preference('sidebar_minimize', 'boolean');
      init_user_preference('sidebar_images', 'boolean');
      init_user_preference('no_sexy_ad_skins', 'boolean');
      
      if (up.user_is_signed_in)
        J('#no_infolinks__value').prop('checked', up.no_infolinks);
    };
  
  self.open =
    function(){
      var groups = this.dataset.userPreferencesActionOpen || '';
      
      //if there is a sidebar preferences in the page but it has been minimized
      //show the sidebar preferences as well in this modal dialog
      if (!/\bsidebar\b/.test(groups)){
        var sidebar_prefs = J('.open-preferences[data-user-preferences-action-open="sidebar"]');
        if (sidebar_prefs.is(':visible') && up.get('sidebar_minimize')){
          groups += ' sidebar';
        }
      }
        
      if (groups !== ''){ groups = '?groups=' + groups.replace(/\s/g, '%20'); }
      ANN.modal('/account/preferences' + groups);
    };
  
  self.show_more =
    function(){
      J(this)
        .addClass('-hidden')
        .closest('.user-preferences').find('.group').removeClass('-hidden');
      ANN.modal.resize_container();
    };
  
  self.close = ANN.modal.close;
  
  self.save =
    function(e){
      e.preventDefault();
      
      if (up.profile_has_changed()){
        ANN.notifications.alert('The profile you are modifying is not currently activated. Your changes have NOT been saved. Please reload the page.');
        J.window.scrollTop(J('#notifications').offset().top);
        return;
      }
      
      var $profile_name_value = J('#profile_name__value');
      if ($profile_name_value.length > 0 && /^\s*$/.test($profile_name_value.val())){
        $profile_name_value.closest('.user-preference.profile-field').addClass('error');
        ANN.notifications.alert('"Profile Name" must not be blank.');
        return;
      }
      else{
        $profile_name_value.closest('.user-preference.profile-field').removeClass('error');
      }
      
      if ($profile_name_value.length > 0){ change('profile_name', { profile: up.get_profile() }); }
      var filter_values = J.makeArray(self.$grid_filter.filter(':checked').map(function(){ return this.value; }));
      change('mainfeed_viewmode');
      change('grid_filters', { value: filter_values });
      change('easyread_text_width');
      change('infinite_scroll');
      change('infinite_scroll_mix_news_and_interest');
      change('sidebar_images');
      change('sidebar_minimize');
      change('no_sexy_ad_skins');
      
      change_no_infolinks();
      
      up.save();
      
      change_texts_for_profile($profile_name_value);
      var selectors = filter_values.slice(0);
      for (var i = 0; i < filter_values.length; i++){ selectors[i] = '[data-filter="' + selectors[i] + '"]'; }
      J('.filters [data-filter]').removeClass('selected').filter(selectors.join(', ')).addClass('selected');
      ANN.grid.set_view_mode(ANN.user_preferences.get('mainfeed_viewmode'), true);
      ANN.grid.track(ANN.user_preferences.get('mainfeed_viewmode'));
      ANN.grid.apply_filters();
      ANN.layout.easyread.update();
      ANN.sidebar.minimize(ANN.user_preferences.get('sidebar_minimize'), true);
      ANN.sidebar.images(ANN.user_preferences.get('sidebar_images'), true);
      
      if (self.is_modal){ self.close(J('[data-user-preferences-form]')); }
      
      if (self.is_modal){ return; }
      alert('Preferences have been saved!');
    };
  
  self.alert_to_register =
    function(){
      var $select = J(this);
      var name = $select.find('option:checked').text();
      $select.val('per_device');
      alert('"' + name + '" profile is only available for registered users.');
    };
  
  self.add_profile =
    function(){
      var name;
      var error_message = '';
      
      do {
        name = prompt(error_message + "Enter a name for your new profile:");
        if (name === null){ return; }
        error_message = '"Profile Name" must not be blank.\n\n';
      } while (/^\s*$/.test(name));
      
      J(
        '<form action="edit" method="post" style="display:none;">' +
          '<input name="add_profile" type="hidden" value="' + name + '">' +
        '</form>'
      ).appendTo(document.body).submit();
    };
  
  self.delete_profile =
    function(e){
      if (!confirm('This will delete the "' + up.get('profile_name') + '" profile. Are you sure?'))
        e.preventDefault();
    };
  
  function select_mainfeed_viewmode(){
    var $this = J(this);
    $this.parent().find('div').removeClass('selected');
    J('#mainfeed_viewmode__value').val(this.className);
    $this.addClass('selected');
  }
  
  function change(param, options){
    options = options || {};
    var profile = 'profile' in options ? options.profile : J('#' + param + '__profile').val();
    var value = 'value' in options ? options.value : infer_value(param);
    
    var descriptor = up.view(param);
    var curr_prof = descriptor.profile || up.get_profile();
    var curr_val = descriptor.value;
    
    if (curr_prof === profile && eql(curr_val, value)){ return; }
    up.change(param, profile, value);
  }
  
  function change_no_infolinks(){
    up.change_no_infolinks = J('#no_infolinks__value').prop('checked');
  }
  
  function eql(a, b){
    if (!(a instanceof Array) || !(b instanceof Array)){ return a === b; }
    if (a.length !== b.length){ return false; }
    for (var i = 0; i < a.length; i++){ if (a[i] !== b[i]){ return false; } }
    return true;
  }
  
  function infer_value(param){
    var $value = J('#' + param + '__value');
    var type = $value.prop('type')
    
    if (type === 'radio' || type === 'checkbox')
      return $value.prop('checked');
    else if (type === 'number')
      return parseFloat($value.val());
    else
      return $value.val();
  }
  
  function init_user_preference(name, type){
    var descriptor = up.view(name);
    var profile = descriptor.profile || up.get_profile();
    if (profile === 'default'){ profile = up.get_profile(); }
    if (up.user_is_signed_in)
      J('#' + name + '__profile > option[value="' + profile + '"]').prop('selected', true);
    var $value = J('#' + name + '__value');
    if (type === 'custom')
      return;
    else if (type === 'boolean')
      $value.prop('checked', descriptor.value);
    else
      $value.val(descriptor.value);
  }
  
  function custom_init_for_mainfeed_viewmode(){
    init_user_preference('mainfeed_viewmode', 'custom');
    J('[data-user-preferences-form] .view-mode > .' + up.get('mainfeed_viewmode')).trigger('click');
  }
  
  function custom_init_for_grid_filters(){
    init_user_preference('grid_filters', 'custom');
    var value = up.get('grid_filters');
    var selector = [];
    for (var i = 0; i < value.length; i++){ selector.push('[value="' + value[i] + '"]'); }
    selector = selector.join(', ');
    self.$grid_filter = J('#grid_filters__profile').closest('.user-preference').find('.filter-list .filter > input[type="checkbox"]');
    self.$grid_filter.filter(selector).prop('checked', true);
    self.$grid_filter.click(function(){
      var $checked = self.$grid_filter.filter(':checked');
      var $coverage = $checked.filter('[value="*"], [value="local"]');
      if ($checked.length === 0)
        self.$grid_filter.prop('checked', false).filter('[value="*"]').prop('checked', true);
      else if (this.checked && $coverage.length > 0)
        self.$grid_filter.not('[value="' + this.value + '"]').prop('checked', false);
    });
  }
  
  function custom_init_for_easyread_text_width(){
    init_user_preference('easyread_text_width', 'number');
    var $er_value = J('#easyread_text_width__value');
    var $er_selector = J('#easyread_text_width__selector');
    var $er_custom = $er_selector.find('option[value="custom"]');
    var er_value = up.get('easyread_text_width');
    if (er_value === 100 || er_value === 200){
      $er_selector.find('option[value="' + er_value + '"]').prop('selected', true);
      $er_custom.hide();
    }
    else{
      $er_custom.text($er_custom.data('text').replace('{{length}}', er_value)).prop('selected', true)
        .data('value', er_value)
        .prop('selected', true)
        .show();
    }
    $er_selector.change(function(){
      if (this.value !== ""){
        var $option = $er_selector.find('option:selected');
        $er_value.val(parseInt($option.data('value') || $option.val()));
        return;
      }
      
      var value;
      var error_message = '';
      
      do {
        value = prompt(error_message + "Number of characters per line: (natural=100)");
        if (value === null){ break; }
        value = parseInt(value);
        error_message = '"Characters per line" must be an integer. Please input an integer value.\n\n';
      } while (isNaN(value));
      
      if (value === null){
        var prev_value = parseInt($er_value.val());
        $er_selector.val(prev_value === 100 || prev_value === 200 ? prev_value : 'custom');
        return;
      }
      if (value === 100 || value === 200){ $er_selector.val(value); $er_value.val(value); return; }
      
      $er_custom.text($er_custom.data('text').replace('{{length}}', value)).prop('selected', true)
        .data('value', value)
        .prop('selected', true)
        .show();
      $er_value.val(value);
    });
  }
  
  function custom_init_for_infinite_scroll(){
    init_user_preference('infinite_scroll', 'boolean');
    J('#infinite_scroll__value').on('change', function(){
      J('#infinite_scroll_mix_news_and_interest').toggle(this.checked);
      ANN.modal.resize_container();
    }).trigger('change');
  }
  
  function change_texts_for_profile($profile_name_value){
    if ($profile_name_value.length === 0){ return; }
    
    var name = $profile_name_value.val();
    J('.profile-picker .profile.active > a').text(name);
    J('.user-preference .profile > .dynamicoption').text(name);
  }
  
}(ANN.user_preferences.ui = {}));

////////////////////////////////////////////////////////////////////////////////
// imagesLoaded Plugin
// http://github.com/desandro/imagesloaded
// MIT License. by Paul Irish et al.

// $('#my-container').imagesLoaded(myFunction)
// or
// $('img').imagesLoaded(myFunction)

// execute a callback when all images have loaded.
// needed because .load() doesn't work on cached images

// callback function gets image collection as argument
//  `this` is the container

(function($){
  $.fn.imagesLoaded = function( callback ) {
    var $this = this,
        $images = $this.find('img').add( $this.filter('img') ),
        len = $images.length,
        blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        loaded = [];
    
    function triggerCallback() {
      callback.call( $this, $images );
    }
    
    function imgLoaded( event ) {
      var img = event.target;
      if ( img.src !== blank && $.inArray( img, loaded ) === -1 ){
        loaded.push( img );
        if ( --len <= 0 ){
          setTimeout( triggerCallback );
          $images.unbind( '.imagesLoaded', imgLoaded );
        }
      }
    }
    
    // if no images, trigger immediately
    if ( !len ) {
      triggerCallback();
    }
    
    $images.bind( 'load.imagesLoaded error.imagesLoaded',  imgLoaded ).each( function() {
      // cached images don't fire load sometimes, so we reset src.
      var src = this.src;
      // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
      // data uri bypasses webkit log warning (thx doug jones)
      this.src = blank;
      this.src = src;
    });
    
    return $this;
  };
})(jQuery);

////////////////////////////////////////////////////////////////////////////////

try{
  document.domain = document.domain; //prevent ads from injecting nastiness in top window
  if (window.parent != window && window.parent.ANN){
    window.frameElement.style.display = 'none';
    throw new Error("ANN iframed in ANN");
  }
}
catch(e){
  //if this page was loaded in an iframe by error, stop everything
  if (e.message.match(/Assignment is forbidden for sandboxed iframes|ANN iframed in ANN/)){
    document.write('<plaintext style="display:none">');
    throw new Error("Page that should be in top window is running in iframe");
  }
}

////////////////////////////////////////////////////////////////////////////////

ANN.layout.body_start();

J.document.ready(ANN.doc_ready);
