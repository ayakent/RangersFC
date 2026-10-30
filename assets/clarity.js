// Microsoft Clarity: heatmaps and session recordings for the public pages
// (club site, game, shop, FC New Mabu, Gila Academy).
// Paste the project ID from clarity.microsoft.com > Settings > Overview.
// Empty means Clarity stays off.
// The Rangers App (/app/) does not load this on purpose: it holds children's
// health details, ID photos and birth certificates, which must not be recorded.
(function () {
  var id = '';
  if (!id) return;
  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",id);
})();
