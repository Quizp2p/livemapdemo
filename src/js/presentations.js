;"use strict";
(function(IPViking) {
  // Toggle table size settings
  state = false;
  states = [{topTableRows: 16, portTableRows: 15, consoleTableRows: 16},
	    {topTableRows: 10, portTableRows: 8, consoleTableRows: 8}];
  d3.select("body").on("keydown", function() {
    d3.event.preventDefault;
    if (d3.event.keyCode == 83) {
      for (var setting in states[state + 0]) {
	IPViking.settings[setting] = states[state + 0][setting];
      }
      state = !state;
    }
  });
  var pymChild =new pym.Child();
  pymChild.sendHeight();
  // lazy-dude's responsive window
   d3.select(window).on('resize', function() {
       location.reload();
   });

})(window.IPViking);