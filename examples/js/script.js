BRITTEN 	= 0;
TATE 		= 1;
JOHNSTON 	= 2;

loadDataset = TATE;//JOHNSTON ;

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
					
						d.from = new Date(+d.date_completed_year, +d.date_completed_month -1, +d.date_completed_day);
	
						d.from.setMonth(d.from.getMonth() - 1);
						
					}		
					d.date = d.from;
					d.id = d.catalogue_no;
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
			
			data.forEach( function(d) {
				
				for( var attribute in d ) {
					
					
					if( attribute.indexOf("date") != -1 ) {
						
						d[attribute] = new Date(d[attribute]);
						
					} else if( d[attribute] == +d[attribute] ) {
						
						d[attribute] = +d[attribute];
						
					}
					
				}
				
				d.title = d.simple_name || "unknown";
				d.date = d.production_date_from;
				
				d.weight = Math.floor( Math.random() * 500 );
				
				if( d.date ) {
					
					d.id = d.inventory;
					
					if( d.summary_date_from ) {
						
						d.from = d.summary_date_from;
						
						if( d.summary_date_to > d.from ) {
							
							d.to = d.summary_date_to;
							
						} else {
							
							d.to = new Date( d.from.valueOf() );
							d.to.setMonth( d.from.getMonth() + 1 );

							
						}
												
					} else {
						
						d.from = d.date;
						d.to = new Date( d.date.valueOf() );
						d.to.setFullYear( d.date.getFullYear() + 1 );	
					}
					
					dataset.push(d);
					
				}
				
				
			})		
			
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
		.attr("width", 800)
		.attr("height", 600)
		.call(timeline);
			
	cf = TT.crossfilter().data(dataset);
	
	if(loadDataset === TATE) {
	
		cf.addFilter({
			dimension: "from", 
			group: d3.time.year 
		});
			
		cf.addFilter({
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
			dimension: "from", 
			group: d3.time.year 
		});
			
		cf.addFilter({
			dimension: "to",
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
	$j( "#slider_threshold" ).slider({
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
	});
	
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
}