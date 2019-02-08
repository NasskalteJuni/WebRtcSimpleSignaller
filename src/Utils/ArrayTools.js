/**
 * A module that offers common array function shorthands
 * @module ArrayTools
 * */
module.exports = {

    /**
     * filters out any duplicates
     * @param {Array} array - the array to filter
     * @param {function} [equal=(a,b) => a===b] - a comparison function that returns true, when two objects are equal.
     * @returns {Array} an array where no entry occurs twice but is unique
     * */
    unique: (array, equal=(a,b) => a===b) => {
        return array.reduce((set, el) => set.findIndex(entry => equal(entry, el)) === -1 ? set.concat(el) : set, []);
    },

    /**
     * remove any occurrences of a given element from the given array
     * @param {Array} array - the array to work with
     * @param {*} el - the array element to remove
     * @param {function} [equal=(a,b) => a===b] - a comparison function that returns true, when two objects are equal.
     * @returns {Array} an array with every element like the given array but without the element to exclude
     * */
    exclude: (array, el, equal=(a,b) => a===b) => {
        return array.filter(entry => !equal(entry, el));
    },

    /**
     * get the set of every element, that is in of both arrays
     * @param {Array} setA - an array of unique elements
     * @param {Array} setB - an array of unique elements
     * @param {function} [equal=(a,b) => a===b] - a comparison function that returns true, when two objects are equal
     * @returns {Array} a set of elements that were part of the given input arrays
     * */
    intersect: (setA, setB, equal=(a,b) => a === b) => {
        return setA.filter(a => setB.findIndex(b => equal(a,b)) >= 0);
    }
};