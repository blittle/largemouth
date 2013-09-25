interface db {
	save(key: string, value: any, callback: (error: any)=>void): db;
	get(key: string, callback: (error: any, value: any)=>void): db;
	remove(key: string, callback: (error: any, value: any)=>void): db;
}

export = db;