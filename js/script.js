BRITTEN = 0;
TATE = 1;

loadDataset = TATE;

var currentYear = new Date().getFullYear(),
	dataset = [],
	timeline,
	urls = ["data/works.js", "http://otis.local:8888/Tate/allartists.js"];
	



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
	
var observer = {

	addSubscriber: function(callback) {
		this.subscribers[this.subscribers.length] = callback;
	},

	removeSubscriber: function(callback) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (this.subscribers[i] === callback) {
				delete(this.subscribers[i]);
			} 
		}
	},
	
	publish: function(what) {
		for (var i = 0; i < this.subscribers.length; i++) {
			if (typeof this.subscribers[i] === 'function') {

				this.subscribers[i](what);
			}
		} 
	},
	
	make: function(o) { // turns an object into a publisher
		for(var i in this) {
			o[i] = this[i];
			o.subscribers = [];
		}
	}
};



function make() {

	timeline = TT.timeline().data(dataset);
	
	d3.select("body").insert("svg", ":first-child")
		.attr("id", "timeline")
		.attr("width", 800)
		.attr("height", 600)
		.call(timeline);
			
	cf = new TT.crossfilter().data(dataset);
/*

	// TATE

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
	
	// BRITTEN

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
	
		title: "Period of composition",
		dimension: function(d) {
			return d.to - d.from
		},
		group: function(d) { return Math.floor(d / 100) * 100;}
	
	})
*/

	d3.select("body").insert("div")
		.attr("id", "crossfilter")
		.call(cf);
		
	observer.make(cf);
	
	cf.addSubscriber(function(data) {
		timeline.data(data);
	})
}