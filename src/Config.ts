export interface Interface {
	events: any;
	rules: any;
	auth?: Function;
	port?: number;
}

export var instance: Interface = {
	events: {},
	rules: {}
}