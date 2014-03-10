


BRITTEN 	= 0;
TATE 		= 1;
JOHNSTON 	= 2;

loadDataset = TATE ;

var currentYear = new Date().getFullYear(),
	dataset = [],
	timeline,
	urls = ["data/works.js", "http://otis.local:8888/Tate/allartists.js", "http://otis.local:8888/ltm/data/Johnston-Data.json"];
	
$j = jQuery.noConflict();


d3.json(urls[loadDataset], function(error, data) {
		
	if(!error) {
		
		if(loadDataset === BRITTEN) {
				
			data = data.works;
		
			data.forEach(function(d) {
						
				if(d.date_completed_year) {
					
					d.to = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
					
					if(d.date_commenced_year) {
						
						d.from = new Date(+d.date_commenced_year, +d.date_commenced_month - 1, +d.date_commenced_day);
						
					} else {
					
						d.from = new Date(+d.date_completed_year, +d.date_completed_month - 1, +d.date_completed_day);
	
						d.from.setMonth(d.from.getMonth() - 1);
						
					}		
					d.date = d.from;
					d.id = d.catalogue_no.replace("/", "-");
					d.weight = 0;
					
					if(d.from > d.to) {
						
						d._from = d.from;
						d.from = d.to;
						d.to = d._from;
						
					}
					
					dataset.push(d);
				}
				
				var worksPerGenre = [];
	
				dataset.forEach( function(d) {
					
					var id = d.genre;
					
					if(worksPerGenre[id]) {
					
						d.weight = Math.min(500, worksPerGenre[id]);
						
					} else {
						
						worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
						d.weight = Math.min(500, worksPerGenre[id]);
						
					}
					
				} )
				
				dataset.sort( function(a,b) { return b.from - a.from } )

			});
			
		}  else if (loadDataset === TATE) {
				
			data.forEach(function(d) {
	
				if(d.birth && d.birth.time) {
					d.yearOfBirth = new Date( +d.birth.time.startYear, 0, 1 );
					d.yearOfDeath = new Date( (d.death ? (d.death.time ? d.death.time.startYear : +d.birth.time.startYear + 80) : currentYear) , 0 , 1 ); // here I'm assuming a lifetime of 80 years (might extend to future)
					d.title		= d.fc;
					d.date		= d.yearOfBirth;
					d.from		= d.yearOfBirth;
					d.to		= d.yearOfDeath;
					d.weight	= d.totalWorks
				
					dataset.push(d);
				}
		
			});
			
		} else if (loadDataset === JOHNSTON) {
			
			console.log(data.length);
			
			data.forEach( function(d) {
				
				for( var attribute in d ) {
					
					if( attribute.indexOf("date") != -1  && d[attribute] !== null) {
					
						d[attribute + "_orig"] = d[attribute];
						
						if(d[attribute] instanceof String) {
							d[attribute] = d[attribute].replace(/BST/, "GMT");						
						}
						d[attribute] = new Date(d[attribute]);
						
					} else if( d[attribute] == +d[attribute] ) {
						
						d[attribute] = +d[attribute];
						
					}
					
				}
				
				d.title = d.simple_name || "unknown";
				d.date = d.production_date_from || new Date();
				
				if( d.date instanceof Date ) {
					
					d.id = d.inventory;
					d.from = d.date;
					
					if( d.production_date_to instanceof Date && d.from.valueOf() <= d.production_date_to.valueOf() ) {
					
						d.to = new Date( d.date.valueOf() );
						d.to.setFullYear( d.date.getFullYear() + 1 );		
						
					} else {
						
						d.to = d.production_date_to || new Date();
						
					}
					
					dataset.push(d);
					
				}
				
				
			} );
			
			// Calculate weight by uniqueness of terms
			terms = Array();
			
			dataset.forEach( function(d) {
				
				if( !terms[d.title] ) {
				
					terms[d.title] = 1;
					
				} else {
				
					terms[d.title]++;
					
				}
				
			} );
			
			var minWeight = undefined, maxWeight = undefined;
			
			for(var i in terms) {
			
				if( minWeight === undefined || minWeight > terms[i] ) {
					
					minWeight = terms[i];
					
				}
				
				if( maxWeight === undefined || maxWeight < terms[i] ) {
					
					maxWeight = terms[i];
					
				}
			
			}
			
			var weightScale = d3.scale.linear()
				.domain( [minWeight, maxWeight] )
				.range( [1, 0]);
				
			dataset.forEach( function(d) {
				
				d.title = d.title;
				d.weight = weightScale( terms[d.title] );
				
			} );
			
			
		}
		
		make();
	
	} else {
	
		console.error(error);
		
	}
	
});	
	

function make() {

	timeline = TT.timeline().data(dataset);
	
	d3.select("body").insert("svg", ":first-child")
		.attr("id", "timeline")
		.attr("class", "timeline")
		.attr("width", 800)
		.attr("height", 600)
		.call(timeline);
			
	cf = TT.crossfilter().data(dataset);
	
	if(loadDataset === TATE) {
	
		cf.addFilter({
			title: "Year born",
			dimension: "from", 
			group: d3.time.year 
		});
			
		cf.addFilter({
			title: "Year died",
			dimension: "to",
			group: d3.time.year 
		});
		
		cf.addFilter({
			dimension: "weight", 
			group: function(d) { return Math.floor(d / 10) * 10;}
		});
	
	} else if (loadDataset === BRITTEN) {
		
		cf.addFilter({
			title: "Started Composition",
			dimension: "from", 
			group: d3.time.year 
		});
			
		cf.addFilter({
			title: "Finished Composition",
			dimension: "to",
			group: d3.time.year
		});
			
		cf.addFilter({
		
			title: "Duration of composition",
			dimension: function(d) {
				return d.to - d.from
			},
			group: function(d) { return Math.floor(d / 100) * 100;}
		
		})
	} else if(loadDataset === JOHNSTON) {
	
		cf.addFilter({
			title: "Production date",
			dimension: "from", 
			group: d3.time.year 
		});
		

		cf.addFilter({
			title: "Acquisition date",
			dimension: function(d) {
				return d.acquired_date_from || new Date();;
			}, 
			group: d3.time.year 
		});

		
		cf.addFilter({
			dimension: "weight", 
			group: function(d) { return Math.floor(d / 10) * 10;}
		});
	}

	d3.select("body").insert("div")
		.attr("id", "crossfilter")
		.call(cf);	
		
	TT.observer.make(cf);
	
	cf.addSubscriber(function(data) {
		timeline.data(data);
	})
	
	cf.forcePublish()
		
	// Make slider
	$j( "#slider_threshold" ).rangeSlider( {
		 
		bounds: { min: 0.001, max: 1 },
		defaultValues: {
			min: timeline.threshold("display"),	
			max: timeline.threshold("collapse")
		},
		formatter:function(val){
	        var value = Math.round(val * 100) / 100,
				decimal = value - Math.round(val);
			return decimal == 0 ? value.toString() + ".0" : value.toString();
		},
		step: 0.01
		
	} ).on("valuesChanging", function(e, data){
		timeline.threshold({
			display: data.values.min,
      		collapse: data.values.max
		});
	});
	
	/*
{
		range: true,
		min: 0,
		max: 1,
		step: 0.01,
		values: [ timeline.threshold("display"), timeline.threshold("collapse") ],
		slide: function( event, ui ) {
			timeline.threshold({
				display: ui.values[0],
	      		collapse: ui.values[1]
	      	});
		}
	}
*/
	
	/*
	$j( "#slider_height" ).slider({
		min: 0,
		max: 20,
		step: 0.1,
		value:timeline.styles.events("height"),
		slide: function( event, ui ) {
			timeline.styles.events({
				height: ui.value,
				fontSize: ui.value - 2
	      	});
		}
	});
	*/
}




function colourByAttribute(attribute) {
	
	var color;
	var values = listUniqueValues(attribute);
		
	// pick color scale
	if (values.length <= 10) {
		color = d3.scale.category10();
	} else if (values.length <= 20) {
		color = d3.scale.category20();
	}

	if(values.length <= 20) {
		fillFunction = function(d) {
			return color(values.indexOf(d[attribute]));
		}
	} else {
		fillFunction = function(d) {
			var step = 360/values.length;
			return d3.hsl(values.indexOf(d[attribute]) * step, .5, .5);
		}
	}

	dataset.forEach(function(d) {
		
		d.color = fillFunction(d);
		
	})
	
	timeline.data(dataset);
	cf.forcePublish();
}

function listAttributes() {
	var keys = Object.keys(dataset[0]);
	console.log(keys);
}

function listDateAttributes() {
	var keys = Object.keys(dataset[0]);
	var dateKeys = [];
	for(i in keys) {
		if(keys[i].indexOf("date") != -1) {
			dateKeys.push(keys[i]);
		}
	}
	console.log(dateKeys);
}

function listUniqueValues(attribute) {
	var values = Array();
	for(i in dataset) {

		if(values.indexOf(dataset[i][attribute]) == -1) {
			values.push(dataset[i][attribute])
		}
		
	}
	values.sort();
	console.log(values);
	return values;
}

function sortByAttribute(attribute) {
	
	var vals = listUniqueValues(attribute);
	
	dataset.sort( function(a,b) {
		
		return vals.indexOf( b[attribute] ) - vals.indexOf( a[attribute] );
		
	} )
	
	timeline.data(dataset);
	//cf.forcePublish();

}
