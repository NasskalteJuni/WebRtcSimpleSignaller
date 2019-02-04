module.exports = {

    unique: (array, equal=(a,b) => a===b) => {
        return array.reduce((set, el) => set.findIndex(entry => equal(entry, el)) === -1 ? set.concat(el) : set, []);
    },

    exclude: (array, el, equal=(a,b) => a===b) => {
        return array.filter(entry => !equal(entry, el));
    },

    intersect: (setA, setB, equal=(a,b) => a === b) => {
        return setA.filter(a => setB.findIndex(b => equal(a,b)) >= 0);
    }
};