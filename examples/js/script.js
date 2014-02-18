BRITTEN = 0;
TATE = 1;

loadDataset = TATE;

var currentYear = new Date().getFullYear(),
	dataset = [],
	timeline,
	urls = ["data/works.js", "http://otis.local:8888/Tate/allartists.js"];
	
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
					d.totalWorks = 0;
					
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
					
						d.totalWorks = Math.min(500, worksPerGenre[id]);
						
					} else {
						
						worksPerGenre[id] = dataset.filter( function(e) {return e.genre == id;} ).length
						d.totalWorks = Math.min(500, worksPerGenre[id]);
						
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
				
					dataset.push(d);
				}
		
			});
			
		}
		
		make();
	
	} else {
	
		console.log(error);
		
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
			dimension: "totalWorks", 
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