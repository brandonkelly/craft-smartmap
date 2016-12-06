
// Define field layout object
var SmartMap_FieldLayout = function ($fieldtype) {
	if (!$fieldtype.hasClass('blueprint-activated')) {
		var parent = this;
		// Initialize layout
		this.layout = {};
		// Define properties
		this.$fieldtype   = $fieldtype;
		this.$layoutInput = $fieldtype.find('.smartmap-fieldtype-layout-values input');
		this.$bpPanel     = $fieldtype.find('.blueprint-panel');
		// Add events
		var triggerInputs = '.layout-table-enable input, .layout-table-width input';
		$layoutTable = $fieldtype.find('.smartmap-fieldtype-layout-table');
		$layoutTable.on('change', triggerInputs, function () {parent.blueprint();});
		// Initialize sortable rows
		$fieldtype.find('.layout-table-rows').each(function () {
			new Sortable(this, {
				handle: '.move',
				animation: 150,
				ghostClass: 'sortable-ghost',
				onUpdate: function () {parent.blueprint();}
			});
		});
		// Initialize blueprint
		this.blueprint();
		$fieldtype.addClass('blueprint-activated');
	}
};

// Render blueprint of field layout
SmartMap_FieldLayout.prototype.blueprint = function() {
	var parent = this;
	// Clear layout
	this.layout = {};
	// Loop through subfields
	this.$fieldtype.find('.layout-table-subfield').each(function () {
		var subfield = $(this).data('subfield');
		parent.layout[subfield] = {};
		parent._subfieldWidth(subfield, $(this));
		parent._subfieldEnabled(subfield, $(this));
		parent._moveBlueprintRow(subfield);
	});
	// Set layout data
	this.$layoutInput.val(JSON.stringify(this.layout));
	// Append clear to bluprint panel
	this.$bpPanel.find('.clear').appendTo(this.$bpPanel);
};

// Check width of subfield
SmartMap_FieldLayout.prototype._subfieldWidth = function(subfield, $el) {
	this.$ltWidth = this.$fieldtype.find('tr[data-subfield="' + subfield + '"] .layout-table-width input');
	this.$bpField = this.$fieldtype.find('.blueprint-' + subfield);
	var width = this.$ltWidth.val();
	if (!width || isNaN(width) || (width > 100)) {
		width = 100;
	} else if (width < 10) {
		width = 10;
	}
	this.$ltWidth.val(width);
	this.$bpField.css({
		'float': 'left',
		'width': (width - 1) + '%',
		'margin-left': '1%'
	});
	this.layout[subfield]['width'] = parseInt(width);
};

// Check if subfield is enabled
SmartMap_FieldLayout.prototype._subfieldEnabled = function(subfield, $el) {
	this.$ltRow = this.$fieldtype.find('tr[data-subfield="' + subfield + '"]');
	this.$bpField = this.$fieldtype.find('.blueprint-' + subfield);
	var checked  = $el.find('.layout-table-enable input').is(':checked');
	if (checked) {
		this.$ltRow.removeClass('disabled');
		this.$bpField.show();
	} else {
		this.$ltRow.addClass('disabled');
		this.$bpField.hide();
	}
	this.layout[subfield]['enable'] = (checked ? 1 : 0);
};

// Move a row in the blueprint
SmartMap_FieldLayout.prototype._moveBlueprintRow = function(subfield) {
	var $blueprintSubfield = this.$fieldtype.find('.blueprint-' + subfield);
	this.$bpPanel.append($blueprintSubfield);
};

// =================================================================================================== //

// When page loads, initialize each field layout
$('.smartmap-fieldtype').each(function () {
	new SmartMap_FieldLayout($(this));
});

// When type select inputs change
$('.matrix-configurator').on('change', 'select[id$="type"]', function () {
	if ('SmartMap_Address' == $(this).val()) {
		$('.smartmap-fieldtype').each(function () {
			new SmartMap_FieldLayout($(this));
		});
	}
});

// =================================================================================================== //
// =================================================================================================== //

var $fieldSetting, mapCurrent;

$(function () {
	$fieldSetting = {
		'lat'  : $('#types-SmartMap_Address-latitude'),
		'lng'  : $('#types-SmartMap_Address-longitude'),
		'zoom' : $('#types-SmartMap_Address-zoom')
	}
	mapCurrent = {
		'lat'  : parseInt($fieldSetting.lat.val()),
		'lng'  : parseInt($fieldSetting.lng.val()),
		'zoom' : parseInt($fieldSetting.zoom.val())
	}
	loadMap();
});

function getCoords() {

	var lat = mapCurrent.lat;
	var lng = mapCurrent.lng;

	// Set default map coordinates
	if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
		coords = {
			'lat': lat,
			'lng': lng
		};
	} else {
		// Set default map position
		coords = {
			'lat': 0,
			'lng': 0
		};
		// If JS geolocation available, recenter
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				coords = {
					'lat': position.coords.latitude,
					'lng': position.coords.longitude
				};
				console.log(coords);
				// var center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				// marker.setPosition(center);
				// map.panTo(center);
			});
		}
	}

	// return new google.maps.LatLng(coords.lat, coords.lng);

	console.log(coords);

	return coords;
}

function loadMap() {

	var coords = getCoords();

	// Set map options
	var mapOptions = {
		zoom: mapCurrent.zoom,
		center: coords,
		scrollwheel: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	// Draw blank map
	var mapCanvas = document.getElementById('types-SmartMap_Address-dragpin-map');
	var map = new google.maps.Map(mapCanvas, mapOptions);

	// Set marker for this map
	var marker = new google.maps.Marker({
		position: coords,
		map: map,
		draggable: true
	});

	// When marker is dropped
	google.maps.event.addListener(marker, "dragend", function(event) {
		map.panTo(event.latLng);
		$fieldSetting.lat.val(event.latLng.lat());
		$fieldSetting.lng.val(event.latLng.lng());
	});

	// When map is zoomed
	google.maps.event.addListener(map, "zoom_changed", function(event) {
		$fieldSetting.zoom.val(map.getZoom());
	});

}
