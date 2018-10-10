////////////////////////////////////////////////////////////////////////////////
//NOCOMMIT

//TODO: replace J.get by J.ajax

(function(self){
  self.absolute_url =
    function(url, attr){
      var a = self.absolute_url.a || (self.absolute_url.a = document.createElement('a'));
      a.href = url;
      if (attr == 'fullpath') return a.pathname + a.search;
      return a[attr || 'href'];
    };
})(ANN);


//do not append ?_=1527625639 to requests
J.ajaxSetup({cache:true});//NOCOMMIT


(function(){
  //Mac OS X / Safari has some bug where Ajax requests with relative urls are
  //*sometimes* sent to the current page instead, as if the relative url was ''.
  //So we setup jQuery and Prototype ajax methods to convert the url to absolute
  //first (overriding XMLHttpRequest.open does not work in all user-agents).
  //Also we add some debugging info for the backend.
  
  function fix_ajax(url, opts, p){
    var optscopy = J.extend({}, opts);
    delete optscopy.data; //don't duplicate POST data in headers
    var optstr = JSON.stringify(opts);
    var headers = p ? (opts.requestHeaders = opts.requestHeaders || {}) : (opts.headers = opts.headers || {});
    if (!('crossDomain' in opts)) opts.crossDomain = (/^(https?:)?\/\/([^\/]+)/.test(url) && RegExp.$2 != document.location.host);
    var url = ANN.absolute_url(url);
    //must send X-Requested-With *before* Ajax-Opts, because if Ajax-Opts is too
    //big then all subsequent headers will not be sent.
    if (!opts.crossDomain) headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['Ajax-URL'] = url;
    headers['Ajax-FW'] = p ? 'P' : 'J'
    if (url == document.location.href)
      if (url.indexOf("/myann/lists/import") < 0)
        headers['Ajax-re-request'] = 'true';
    headers['Ajax-Opts'] = optstr;
//  if (!opts.crossDomain) headers['Ajax-Stack-Trace'] = JSON.stringify((new Error()).stack); //NOCOMMIT
//  console.log('AJAX: '+url); console.log(opts);
    return url
  }
  
  window.Prototype_setup_ajax = function(){
    Ajax.Responders.register({
      onCreate: function(ajax) {
        ajax.url = fix_ajax(ajax.url, ajax.options, true);
      }
    });
  };
  
  var original_ajax = J.ajax;
  
  J.ajax =
    function(url, opts){
      if (typeof url === 'object'){
        opts = url;
        url = opts.url;
      }
      opts = opts || {};
      opts.type = opts.type || (url.match(/!$/) ? 'POST' : 'GET');
      url = fix_ajax(url, opts);
      
      //expose a reference to the native xhr object
      var jqXHR, xhr;
      opts.xhr = function(){
        xhr = J.ajaxSettings.xhr();
        xhr.joptions = this;
        if (jqXHR) jqXHR._options1 = xhr.joptions;
        if (jqXHR) jqXHR._xhr = xhr;
        return opts._xhr = xhr;
      };
      jqXHR = original_ajax(url, opts);
      jqXHR._options0 = opts;
      if (xhr) jqXHR._options1 = xhr.joptions;
      if (xhr) jqXHR._xhr = xhr;
//      console.log(jqXHR);
      return jqXHR;
    };
  
})();


