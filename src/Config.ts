export interface Interface {
	events: any;
	rules: any;
	port?: number;
}

export var instance: Interface = {
	events: {},
	rules: {}
}