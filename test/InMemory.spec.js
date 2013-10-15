var InMemory = require('../src/db/InMemory');

describe('In Memory DB', function () {
    var db;

    beforeEach(function () {
        db = new InMemory();
    });

    afterEach(function() {

    })

    it('Should save data into the in memory database', function(run) {
        db.set('path', {value: 'hello', version: 0, children: {}}, function() {
            expect(db.data.children.path.value).toBe('hello');
            run();
        });
    });

    it('Should save nested paths into the memory database', function(run) {
        db.set('nested/path', {value: 'hello', version: 0, children: {}}, function() {
            expect(db.data.children.nested.children.path.value).toBe('hello');
            run();
        });
    });

    it('Should pull data out of the database', function(run) {
        db.set('nested/path', {value: 'hello', version: 0, children: {}}, function() {
            db.get('nested/path', function(err, element) {
                expect(err).toBeNull();
                expect(element.value).toBe('hello');
                run();
            });
        });
    });

    it('Should not update parent versions when a child changes', function(run) {
        db.set('deep/nested/path1', {value: 'path1', version: 0, children: {}}, function() {
            db.set('deep/other/path2', {value: 'path2', version: 0, children: {}}, function() {
                db.set('deep/nested/path1', {value: 'path1a', version: 0, children: {}}, function() {
                    db.get('deep/nested', function(err, value1) {
                        db.get('deep/other/path2', function(err, value2) {
                            expect(db.data.version).toBe(0);
                            expect(value1.version).toBe(0);
                            expect(value2.version).toBe(0);
                            run();
                        });
                    });
                });
            });
        });
    });

    it('Should update an individual version', function(run) {
        console.log('Dude');
        db.set('deep/nested/path', {value: 'mumtaz', version: 0, children: {}}, function() {
            db.updateVersion('deep/nested', function() {
                db.updateVersion('deep/nested', function() {
                    db.get('deep/nested', function(err, value) {
                        expect(value.version).toBe(2);
                        run();
                    });
                });
            });
        });
    });

    it('Should remove paths from the db', function(run) {
        db.set('deep/nested/path1', {value: 'mumtaz', version: 0, children: {}}, function() {
            db.remove('deep/nested/path', function() {
                db.get('deep/nested/path', function(err, value) {
                    expect(value.value).toBeUndefined();
                    run();
                });
            });
        });
    });

    it('Should merge data with update', function(run) {
        db.set('deep/nested/path1', {value: 'mumtaz', version: 0, children: {}}, function() {
            db.update('deep/nested', {version: 0, children: {
                path2: {
                    value: 'kwaayis',
                    version: 0,
                    children: {}
                }
            }}, function() {
                db.get('deep/nested', function(err, value) {
                    expect(value.children.path1).toBeDefined();
                    expect(value.children.path2).toBeDefined();
                    expect(value.children.path1.value).toBe('mumtaz');
                    expect(value.children.path2.value).toBe('kwaayis');
                    run();
                });
            });
        });
    });

    it('Should deeply merge data on update', function(run) {
        db.set('deep/nested/path1', {version: 0, children: {
            child1: {
                value: 1,
                version: 0,
                children: {}
            }
        }}, function() {
            db.update('deep/nested', {version: 0, children: {
                path1: {
                    version: 0,
                    children: {
                        child2: {
                            value: 2,
                            version: 0,
                            children: {}
                        }
                    }
                }
            }}, function() {
                db.get('deep/nested', function(err, value) {
                    expect(value.children.path1.children.child1).toBeDefined();
                    expect(value.children.path1.children.child2).toBeDefined();
                    expect(value.children.path1.children.child1.value).toBe(1);
                    expect(value.children.path1.children.child2.value).toBe(2);
                    run();
                });
            });
        });
    });

});