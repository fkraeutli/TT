TATEART = 0;
COOPER = 1;
TICTAC = 2;
OXFORD = 3;
GEFFRYE = 4;
TATEJSON = 5;
LTM = 6;
PENN = 7;
VANDA = 8;

if (!location.hash) {

	loadDataset = TATEART;

} else {
	
	switch ( location.hash ) {
		
		case "#tate":
			loadDataset = TATEART;
			break;
			
		case "#tatejs":
			loadDataset = TATEJSON;
			break;
			
		case "#cooper":
			loadDataset = COOPER;
			break;
			
		case "#tictac":
			loadDataset = TICTAC;
			break;
			
		case "#oxford":
			loadDataset = OXFORD;
			break;
			
		case "#geffrye":
			loadDataset = GEFFRYE;
			break;
			
		case "#ltm":
			loadDataset = LTM;
			break;
			
		case "#ltmac":
			loadDataset = LTM;
			break;
			
		case "#penn":
			loadDataset = PENN;
			break;
			
		case "#vanda":
			loadDataset = VANDA;
			break;
		
		
	}
	
}


$j = jQuery.noConflict();

var dataset = [],
	heap,
	timeline,
	fields,
	ui;


$j( make );

function make() {

	timeline = TT.timeline()
		.domain( [ new Date(1950,0,1), new Date(2014,0,1) ] );
	
	d3.select("svg#timeline")
		.attr("class", "timeline")
		.attr("width", $j(window).width() )
		.attr("height", $j(window).height() )
		.call(timeline);
	
	$j(window).resize(function() {
		timeline.width( $j(window).width() )
			.height( $j(window).height() );
	});
	
	
	if ( loadDataset == TATEART ) {
		
		d3.csv( "../../Tate/artwork_data_latest.csv", function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
					if(d.year) {
						
						d.from = new Date( +d.year, 0, 1 );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );
					
						// Replace thumbnail url for local one REMOVE THIS
						
						if ( d.thumbnailUrl ) {
							
							d.thumbnailUrl = "http://otis.local:8888/Tate/local/" + /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl )[0];
							
						}
						
					
						if ( !isNaN(d.from.valueOf()) ){
							dataset.push(d);
						}
					}
					
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
		
	} else if (loadDataset === TATEJSON) {
	
		
		d3.json( "../../Tate/allartworks.js", function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
					if(d.dateRange && d.dateRange.startYear) {
						
						d.from = new Date( +d.dateRange.startYear, 0, 1 );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );

						// Replace thumbnail url for local one REMOVE THIS
						
						if ( d.thumbnailUrl ) {
							
							var r = /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl);
							
							if ( r &&  r.length ) {
							
								d.thumbnailUrl = "http://otis.local:8888/Tate/local/" + /([A-Z0-9])*_8.jpg$/.exec( d.thumbnailUrl)[0];
								
							}
							
						}
						
					
						if ( !isNaN(d.from.valueOf()) ){
							dataset.push(d);
						}
					}
					
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
		
				
	} else if ( loadDataset == GEFFRYE ) {
	
		GeffryeAPI.initObjectDataset();
		
		var heapInitialised = false;
		var initialLoading = true;
		
		$j( document ).on("loadingCompleted", function() {
			
				console.log( "Dataset Loaded" );
			
		} )
		.on( "loadingProgressed", function ( event, numFetched, numRows ) {
		
			console.log( Math.floor( numFetched / numRows * 100 ) + "% loaded" );
		
			dataset = GeffryeAPI.dataset();
			
			if ( ! heapInitialised ) {
				
				makeHeap();
				
				heapInitialised = true;
				
			} else {
				
				if ( initialLoading ) {
					heap.data( dataset );
				}
				
			}
			
			if ( numFetched >= numRows ) {
				
				initialLoading = false;
				//$j( this ).off( "loadingProgressed" );
				
			}
		
		} );
		
	} else if ( loadDataset === VANDA ) {
		
		VandAAPI.initObjectDataset();
		
		var VAheapInitialised = false;
		var VAinitialLoading = true;
		
		$j( document ).on("loadingCompleted", function() {
			
				console.log( "Dataset Loaded" );
			
		} )
		.on( "loadingProgressed", function ( event, numFetched, numRows ) {
		
			console.log( Math.floor( numFetched / numRows * 100 ) + "% loaded" );
		
			dataset = VandAAPI.dataset();
			
			if ( ! VAheapInitialised ) {
				
				makeHeap();
				
				VAheapInitialised = true;
				
			} else {
				
				if ( VAinitialLoading ) {
					heap.data( dataset );
				}
				
			}
			
			if ( numFetched >= numRows ) {
				
				VAinitialLoading = false;
				//$j( this ).off( "loadingProgressed" );
				
			}
		
		} );
		
		
	} else if ( loadDataset === COOPER ) {
		
						
		d3.csv( "../../coopeHewittCollection/meta/objects.csv", function(error, data) {		
			
			if( !error ) {				
								
				data.forEach( function(d) {
					
					if(d.year_start !== "" && d.year_end !== "") {
						
						d.from = new Date( +d.year_start, 0, 1 );
						d.to = new Date( +d.year_end, 0, 1 );
						
					
						if ( d.primary_image && d.primary_image !== "" ) {
							d.thumbnailUrl = d.primary_image.replace(/(_n.jpg|_z.jpg)/, "_b.jpg");
						}
					
						if ( !isNaN(d.from.valueOf()) ){
							dataset.push(d);
						}
					}

					
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
			
		});
		
	} else if ( loadDataset === TICTAC ) {		
		
		d3.csv( "../../ssl/tictac/tictac_tablets.csv", function(error, data) {
			
			if( !error ) {						
								
				data.forEach( function(d) {
					
					if(d.date_entered_timestamp) {
						
						d.id = d.tablet_id;
						
						d.from = new Date( d.date_entered_timestamp );
						
						d.to = new Date( d.from.valueOf() );
						d.to.setFullYear( d.from.getFullYear() + 1 );
						
						d.thumbnailUrl = "../../ssl/tictac/assets/" + d.image_front;
					
						if ( !isNaN(d.from.valueOf()) ){
							dataset.push(d);
						}
					}

					
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
		
	} else if ( loadDataset == OXFORD ) {
				
		d3.csv( "../../oxford/data/pottery.csv", function(error, data) {
	
			if ( !error ) {
			
				data.forEach( function(d) {
					
				
					d.id = d["Record - Vase-Number"];
				
					d.from = new Date( d["Record - Date - From-Date"], 0, 1);
					d.to = new Date( d["Record - Date - To-Date"], 0, 1);
					
					//d.thumbnailUrl = "http://www.beazley.ox.ac.uk/Watermark/displayImage.asp?id=" + d["Record - id"];
					d.thumbnailUrl = "http://www.beazley.ox.ac.uk/Vases/SPIFF/" + d["Record - Image-Record - Filename"].split(";")[0] + "cc001001.jpe";
					
					if ( !isNaN(d.from.valueOf()) ){//&& d.from.getFullYear() != 1900 ){
						dataset.push(d);
					}
				
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
			
			}	
		} );
	
		
	} else if (loadDataset === LTM) {


		var url_images = "http://www.ltmcollection.org/images/best/";
		var getThumbnailUrl = function(d) {
	
			if ( ! d.reference_type ) {
				
				return null;
				
			}
			
			var ref_types = d.reference_type.split(";");
			var digital_index = ref_types.indexOf("Digital rep");

			if(digital_index != -1) {

				var ref_values = d.reference_value.split(";");
				var ref_value = ref_values[digital_index];

				var url = url_images + ref_value.substr(-2) + "/" + ref_value + ".jpg";
				
				return url;
			}
			
		};
		
		d3.json( "../../ltm/data/Johnston-Data.json", function(error, data) {
		
			if( !error ) {			
				
				window.setDateFrom = function ( field ) {
						
					data.forEach( function( d ) {
						
						d.from = new Date ( d[ field + "_from"] );
						d.to = new Date ( d[ field + "_to"] );
						
					} );
					
					heap.data( data );
					
				};					
						
				data.forEach( function( d, i ) {
					
					d.id = i;
					
					d.from = new Date ( d.production_date_from );
					d.to = new Date ( d.production_date_to);
					
					if ( location.hash == "#ltmac" ) {
												
						d.from = new Date ( d.acquired_date_from );
						d.to = new Date ( d.acquired_date_to);
					}
				
					
					d.thumbnailUrl = getThumbnailUrl( d );
					
					if ( !isNaN(d.from.valueOf()) ){
						dataset.push(d);
					}
					
					if ( d.production_role && d.production_name ) {
						
						var roles = d.production_role.split( ";" );
						var names = d.production_name.split( ";" );
						
						for ( var j = 0; j < roles.length; j++ ) {
							
							d[ roles[ j ] ] = names[ j ];
							
						}
						
					}
					
					if ( d.content_type && d.content_details) {
						
						var types = d.content_type.split( ";" );
						var details = d.content_details.split( ";" );
						
						for ( var k = 0; k < types.length; k++ ) {
							
							d[ types[ k ] ] = details[ k ];
							
						}
						
					}
	
				} );
				
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
		
				
	} else if (loadDataset === PENN) {
		
		d3.csv( "../../Penn/all-20150621.csv", function(error, data) {
		
			if( !error ) {
								
				data.forEach( function(d) {
					
	
					if(d.date_made !== "") {
						
						d.id = d.object_number;
						d.from = new Date( +d.date_made_early, 0, 1 );
						d.to = new Date( +d.date_made_late, 12, 31 );
					
						d.from.setFullYear( +d.date_made_early );
						d.to.setFullYear( +d.date_made_late );
						
						if ( d.from > d.to ) {
							
							d.from.setFullYear ( +d.date_made_early * -1 );
							d.to.setFullYear ( +d.date_made_late * -1 );							
						}
					
						if ( !isNaN(d.from.valueOf()) &&  !isNaN(d.to.valueOf()) ){
							dataset.push(d);
						}
					}
					
				} );
				
				//dataset.splice( 5080 );
					
				console.log( dataset.length + " instances" );			

				makeHeap();
				
			} else {
				
				console.error(error);
			
			}
		});
	}
				

	//makeHeap();
	
		
}



function makeHeap() {

	heap = TT.layout.heap().data( dataset );
	
	timeline.add( heap );	
	
	if ( loadDataset == GEFFRYE ) {
	
		fields = [
				
				
			{
				
				title: "Collection",
				field: "collectionCategory",
				accessor: function(d) {
					
					return d.collectionCategory;
					
				},
							
			},
			
			{
				
				title: "Location",
				field: "location",
				accessor: function(d) {
					
					return d.location;
					
				}
				
			},
			
			{
				
				title: "Materials",
				field: "materials",
				accessor: function(d) {
					
					return d.materials;
					
				}
				
			},
			
			{
				
				title: "Keywords",
				field: "webKeywords",
				accessor: function(d) {
					
					return d.webKeywords;
					
				}
				
			},
			
			{
				
				title: "Room",
				field: "room",
				accessor: function(d) {
					
					return d.room;
					
				}
				
			},
			
			{
				
				title: "Has image",
				field: "thumbURL",
				accessor: function(d) {
					
					return d.thumbnailUrl === "" ? "No" : "Yes";
					
				}
				
			}
				
		];
		
		var initCallback = function( callback ) {
					
			var obj = this;
			
			GeffryeAPI.loadField( obj.field, function() {
				
				delete obj.initialise;
				callback();
				
			} );
			
		};
		
		for( var i = 0; i < fields.length; i++ ) {
			
			fields[ i ].initialise = initCallback;
						
		}
		
		record = {
					
			title: function(d) {
				
				return d.title[0] || d.wholeObjectName;
				
			},
			
			subtitle: function(d) {
				
				return d.labelText;
				
			},
			
			image: function(d) {
				
				return d.thumbnailUrl;
			}
			
		};
		
	} else if ( loadDataset == VANDA ) {
	
			
	
		fields = [
				
			{
			
			title: "Artist",
			accessor: function(d) {
				
					return d.fields.artist;
					
				}
			},	
			{
			
			title: "Location",
			accessor: function(d) {
				
				return d.fields.location;
						
				}
			},
			{
			
			title: "Object",
			accessor: function(d) {
				
				return d.fields.object;
						
				}
			},
			{
			
			title: "Place",
			accessor: function(d) {
				
				return d.fields.place;
				
				}
			}
						
		];
		
		record = {
					
			title: function(d) {
				
				return d.fields.title;
				
			},
			
			subtitle: function(d) {
				
				return d.fields.date_text;
				
			},
			
			image: function(d) {
				
				return d.thumbnailUrl;
			}
			
		};
		
	} else if (loadDataset == TATEJSON) {
		
		fields = [
			
			{
				title: "Classification",
				accessor: function(d) {
					return d.classification;
				}
				
			},
			
			{
				title: "Artist",
				accessor: function(d) {
				
					if(d.contributors.length) {
						
						var list = Array();
						
						for( var i = 0; i < d.contributors.length; i++ ) {
							
							list.push( d.contributors[ i ].fc );
							
						}
						return list;
					
					}
					
					return "unknown";
					
				}
			},
			
			{
				title: "Medium",
				accessor: function(d) {
				
					return d.medium;
					
				}
			},
			
			{
				title: "Movements",
				accessor: function(d) {
					
					if ( ! d.movements ) {
						
						return Array( "unspecified" );
						
					}
					
					var movementNames = Array();
					
					for ( var i = 0; i < d.movements.length; i++ ) {
						
						movementNames.push( d.movements[ i ].name );
						
					}
					
					
					return movementNames;	
					
				}
			}
			
	/*
,
			
			{
				title: "Subjects",
				accessor: function(d) {
				
					if( ! d.subjects) return [];		
				
					var allSubjects = Array();
					
					var getSubjects = function( obj ) {
					
						allSubjects.push( obj );
						
						if( obj.children && obj.children.length) {
							
							obj.children.forEach( function(child) {
								
								getSubjects(child);
	
							} );
							
						}
					
					}
					
					getSubjects(d.subjects);
					
					var subjectNames = Array();
					
					for( var i = 0; i < allSubjects.length; i++ ) {
						
						subjectNames.push( allSubjects[ i ].name );
						
					}
					console.log( "doing" );
					
					return subjectNames;
				}
	
			}
*/
			
			
		];
		
		
		record = {
			
			title: function(d) {
				return d.title;
			},
			
			subtitle: function(d) {
				return d.artist + "<br>" + d.dateText;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
	
	} else if ( loadDataset == TATEART ) {
		
		fields = [
			{
			
				title: "Artist",
				accessor: function(d) {
					return d.artist;
				}
				
			},
			{
				
				title: "Medium",
				accessor: function(d) {
				return d.medium;
				}
				
			},
			{
			
				title: "Artist Role",
				accessor: function(d) {
					return d.artistRole;
				}
				
			}
		];
		
		record = {
			
			title: function(d) {
				return d.title;
			},
			
			subtitle: function(d) {
				return d.artist + "<br>" + d.dateText;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
		
	} else if (loadDataset == COOPER) {
		
		record = {
			
			title: function(d) {
				return d.title;
			},
			
			subtitle: function(d) {
				return d.provenance + "<br>" + d.date;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
		
		fields = [
				{
				
					title: "Medium",
					accessor: function(d) {
						return d.medium;
					}
					
				},
				{
				
					title: "Decade",
					accessor: function(d) {
						return d.decade;
					}
					
				},
				{
				
					title: "Signed",
					accessor: function(d) {
						return d.signed;
					}
					
				},
				{
				
					title: "Markings",
					accessor: function(d) {
						return d.markings;
					}
					
				},
				{
				
					title: "Year Acquired",
					accessor: function(d) {
						return d.year_acquired;
					}
					
				}
			];
		
	} else if (loadDataset == TICTAC) {
		
		record = {
			
			title: function(d) {
				return d.product_name;
			},
			
			subtitle: function(d) {
				return d.coating + "<br>" + d.date_entered;
			},
			
			image: function(d) {
				return d.thumbnailUrl;
			}
			
		};
		
		fields = [
				{
				
					title: "Coating",
					accessor: function(d) {
						return d.coating;
					}
					
				},
				{
				
					title: "Country",
					accessor: function(d) {
						return d.country_of_origin;
					}
					
				},
				{
				
					title: "Marking",
					accessor: function(d) {
						return d.marking;
					}
					
				},
				{
				
					title: "Colour",
					accessor: function(d) {
						return d.colour;
					}
					
				},

				{
				
					title: "Plan",
					accessor: function(d) {
						return d.plan;
					}
					
				},
				{
				
					title: "Scoring",
					accessor: function(d) {
						return d.scoring;
					}
					
				}
			];
		
	} else if (loadDataset == OXFORD) {
		
		record = {
			
			title: function(d) {
				console.log( d );
				return "Vase #" + d["Record - Vase-Number"];
			},
			
			subtitle: function(d) {
				return d["Record - Date - From-Date"] + " &ndash; "  + d["Record - Date - To-Date"] + " (" + d["Record - Date-Range"] +  ")";
			},
			
			image: function(d) {
				return "";
			}
			
		};
		
		fields = [
				
				{
				
					title: "Artist",
					accessor: function(d) {
						return d["Record - Attributed-To - Artist - Artist-Name"];
					}
					
				},
				
				{
				
					title: "Scholar",
					accessor: function(d) {
						return d["Record - Attributed-To - Scholar - Scholar-Name"];
					}
					
				},
				
				{
				
					title: "Collections",
					accessor: function(d) {
						return d["Record - Collection-Record - Collection - Collection-Code"].split( ";" );
					}
					
				},
				
				{
				
					title: "Technique",
					accessor: function(d) {
						return d["Record - Technique"];
					}
					
				},
				{
				
					title: "Collection",
					accessor: function(d) {
						return d["Record - Collection-Record - Collection - Collection-Name"].split( ";" );
					}
					
				},
				
				{
				
					title: "Provenance",
					accessor: function(d) {
						return d["Record - Provenance"];
					}
					
				},
				{
				
					title: "Shape",
					accessor: function(d) {
						return d["Record - Shape-Record - Shape-Name"];
					}
					
				},
				{
					title: "Fabric",
					accessor: function(d) {
						
						return d["Record - Fabric"];
						
					}
					
				},
				
				{

					title: "Inscription Type",
					accessor: function(d) {
						
						return d["Record - Inscriptions - Inscription-Type"].split( ";" );
						
					}
					
					
				}
			];
		
	} else if ( loadDataset == LTM ) {
		
		heap.styles.events( "diameter", 2 );
		heap.styles.images( "factor", 2 );
		heap.threshold( "images", 10 );
		heap.threshold( "display", 500 );
	
		
		record = {
					
			title: function(d) {
				
				return d.simple_name;
				
			},
			
			subtitle: function(d) {
				
				return d.summary;
				
			},
			
			image: function(d) {
				
				return d.thumbnailUrl;
			}
			
		};	
		
		fields = [
				
				
			{
				
				title: "Object",
				accessor: function(d) {
					
					return d.object;
					
				},
							
			},	
				
			{
				
				title: "Division",
				accessor: function(d) {
					
					return d.division;
					
				},
							
			},	
				
			{
				
				title: "Name",
				accessor: function(d) {
					
					return d.simple_name;
					
				},
							
			},	
				
			{
				
				title: "Collection",
				accessor: function(d) {
					
					return d.collection;
					
				},
							
			},	
				
			{
				
				title: "Curator",
				accessor: function(d) {
					
					return d.curator;
					
				},
							
			},	
				
			{
				
				title: "Hazards",
				accessor: function(d) {
					
					return d.hazards;
					
				},
							
			},	
				
			{
				
				title: "Acquisition Method",
				accessor: function(d) {
					
					return d.acquisition_method;
					
				},
							
			},	
				
			{
				
				title: "Insurance Value",
				accessor: function(d) {
					
					return d.insurance_value;
					
				},
							
			},	
				
			{
				
				title: "Designer",
				accessor: function(d) {
					
					return d.Designer ? d.Designer : "unknown";
					
				},
							
			},	
				
			{
				
				title: "Printer",
				accessor: function(d) {
					
					return d.Printer ? d.Printer : "none";
					
				},
							
			},	
				
			{
				
				title: "Publisher",
				accessor: function(d) {
					
					return d.Publisher ? d.Publisher : "none";
					
				},
							
			},	
				
			{
				
				title: "Theme",
				accessor: function(d) {
					
					return d.Theme ? d.Theme : "none";
					
				},
							
			}
			
		];

	}else if ( loadDataset == PENN ) {
		
		fields = [
			{
			
				title: "Creator",
				accessor: function(d) {
					return d.creator;
				}
				
			},
			{
				
				title: "Culture",
				accessor: function(d) {
				return d.culture.split("|");
				}
				
			},
			{
				
				title: "Culture Area",
				accessor: function(d) {
				return d.culture_area;
				}
				
			},
			{
				
				title: "Curatorial Section",
				accessor: function(d) {
				return d.curatorial_section;
				}
				
			},
			{
				
				title: "Iconography",
				accessor: function(d) {
				return d.iconography;
				}
				
			},
			{
				
				title: "Material",
				accessor: function(d) {
				return d.material;
				}
				
			},
			{
				
				title: "Period",
				accessor: function(d) {
				return d.period.split("|");
				}
				
			},
			{
				
				title: "Provenience",
				accessor: function(d) {
				return d.provenience.split("|");
				}
				
			},
			{
				
				title: "Technique",
				accessor: function(d) {
				return d.technique.split("|");
				}
				
			}
		];
		
		record = {
			
			title: function(d) {
				return d.obect_name;
			},
			
			subtitle: function(d) {
				return d.date_made;
			},
			
			image: function(d) {
				return false;
			}
			
		};
		
	} 
	
	
	ui = TT.ui.panel().heap( heap ).fields( fields ).record( record ).initialise();

		
}
