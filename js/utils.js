var Hierarchy = function(data, accessor) {
	
	var identifier = "name",
		hierarchy = false,
		rebuild = false;
	
	this.hierarchy = function() {
	
		var addToKeys = function(element) {

			if(typeof element === "object") {

				p = keys[element[identifier]];

			} else {

				p = keys[element];

			}

			if (!p) {

				p = {
					element: element,
					children: []
				};
			}

			p.children.push(data[i]);


			if(typeof element === "object") {
	
				keys[element[identifier]] = p;

			} else {

				keys[element] = p;

			}

		};
	
		if(hierarchy && !rebuild) {
			return hierarchy;
		}
	
		hierarchy = [];
		var keys = [];
	
		if( !accessor) {
			console.log("ERROR no accessor for hierarchy");
			return false;
		}
	
	
		for (var i=0; i < data.length; i++) {
	
			var parents = accessor.call(data, data[i]);
	
			if( Object.prototype.toString.call( parents ) != "[object Array]") {
	
				parents = [parents];
	
			}
	
	
			parents.forEach( addToKeys );
	
	
		}
	
		for (i=0; i<keys.length; i++) {
	
			if( typeof keys[i].element != "object" ) {
				keys[i].element = {
					name: keys[i].element
				};
			}
	
			keys[i].element.children = keys[i].children;
			hierarchy.push(keys[i].element);
	
		}
	
		rebuild = false;
	
		return hierarchy;
	};
	
	// accessors
	this.data = function(_) {
		if(!arguments.length) return data;
		data = _;
		rebuild = true;
	};
	
	this.identifier = function(_) {
		if(!arguments.length) return identifier;
		identifier = _;
		rebuild = true;
	};
	
	this.accessor = function(_) {
		if(!arguments.length) return accessor;
		accessor = _;
		rebuild = true;
	};

};

