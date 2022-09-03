// eslint-disable-next-line @typescript-eslint/no-unused-vars
const baseLogFunction = console.log; // store the original console.log function (could be restored later)

console.log = (...data) => {
	// send data of console log to workflow monitor
	return data.forEach(d => {
		let cache = [];
		return self.postMessage(
			// prevent circular references
			JSON.stringify(
				d,
				(key, value) => {
					if (typeof value === 'object' && value !== null) {
						// Duplicate reference found, discard key
						if (cache.includes(value)) return 'CURCULAR @' + key;
						// Store value in our collection
						cache.push(value);
					}
					return value;
				},
				'\t',
			),
		);
	});
};

// helper function that directly recievcies the variables of the workflow
self.onvariables = _ => null;

// connect the helper with actual postMessage
self.onmessage = ({ data }) => self.onvariables(data);
