$(function () {
  var map = L.map('map').setView([-33.923, 18.427], 12);

  L.tileLayer.grayscale('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 8,
    maxZoom: 16,
    attribution: 'Street map &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);

  var defaultStyle = {
    stroke: true,
    color: '#377eb8',
    weight: 2,
    opacity: 0.75,
    fill: false,
    className: 'route-line'
  };

  var hiliteStyle = {
    stroke: true,
    color: '#e41a1c',
    weight: 3,
    opacity: 1,
    fill: false,
    className: 'route-line'
  };

  var jsonLayer;

  var clickreq;
  var aborting = false;

  function abortreq () {
    aborting = true;
    if (clickreq) clickreq.abort();
    aborting = false;
  }

  function mapclick (event) {
    var x = event.latlng.lng,
      y = event.latlng.lat,
      z = map.getZoom();
    if (clickreq) abortreq();
    clickreq = $.getJSON('/point/' + z + '/' + x + '/' + y)
      .done(function (data) {
        if (aborting) return;
        clickresult(data);
      })
      .fail(function () {
        if (aborting) return;
        alert("Couldn't communicate with the server. Please check your network connection and try again.");
      })
  }

  function clickresult (data) {
    $('#table-box').css('display', 'block');
    var table = $('#route-table');
    table.find('tr').remove();
    _.each(data.routes, function (route) {
      var newrow = $('<tr/>');
      newrow.data('routeid', route.id);
      newrow.append($('<td/>').addClass('route-no').text(route.name));
      var newlink = $('<a/>')
        .attr('href', '#')
        .text(route.orgn + ' - ' + route.dstn)
        .bind('click', function (e) { e.preventDefault(); tableclick(route.id); });
      newrow.append($('<td/>').addClass('route-name').append(newlink));
      table.append(newrow);
    });

    var ids = _.map(data.routes, 'id');

    jsonLayer.eachLayer(function (layer) {
      if (_.includes(ids, layer.feature.id)) {
        layer.bringToFront();
        layer.setStyle(hiliteStyle)
      } else {
        layer.setStyle(defaultStyle)
      }
    });
  }

  function tableclick(id) {
    var rows = $('#route-table').find('tr');
    rows.removeClass('selected-row');
    rows.filter(function() { return $(this).data('routeid') == id; } ).addClass('selected-row');

    jsonLayer.eachLayer(function (layer) {
      if (id == layer.feature.id) {
        layer.bringToFront();
        layer.setStyle(hiliteStyle)
      } else {
        layer.setStyle(defaultStyle)
      }
    });
  }

  $.getJSON('taxiroutes.topojson')
    .done (function (data) {
      $('#spinner-layer').remove();

      var features = topojson.feature(data, data.objects.taxiroutes);

      jsonLayer = L.geoJson(features, {
        style: defaultStyle,
        onEachFeature: function (feature, layer) { layer.on('click', mapclick); }
      }).addTo(map);

      map.attributionControl.addAttribution('taxi routes from City of Cape Town');

    })
    .fail(function () {
      alert("Couldn't download the taxi route data. Please check your network connection and refresh the page.");
    })
});
