/*
 * Largemouth will support any database that implements 
 * this interface.
 *
 * Largemouth consists of a tree structure where only
 * the leaf nodes have "values". Each node in the tree has 
 * a version which is incremented when it or one of its 
 * children changes.
 */ 

export interface db {
	
	// Place a value into the database at a given path replacing any previoius 
	// structure. If the value is hash object, the object children will be 
	// added to the database as children.
	set(key: string, value: element, callback: (error: any)=>void): db;

	// The same as set except will merge the data rather than replace.
	update(key: string, value: element, callback: (error: any)=>void): db;

	// Retrieve the value (or any of its children) at a given path. 
	get(key: string, callback: (error: any, value: element)=>void): db;

	// Delete the value/children at a given path
	remove(key: string, callback: (error: any, value: any)=>void): db;
	
	// Update the version at a given path
	updateVersion(key: string, callback: (error: any)=>void): db;
}

export interface element {
	value?: any;
	version: number;
	children?: any;
}
