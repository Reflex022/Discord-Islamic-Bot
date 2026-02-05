
/**
 * @param {number} ms 
 * @returns {Promise<void>} 
 * @example
 * await sleep(2000); // Wait for 2 seconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {Function} fn 
 * @param {number} maxRetries 
 * @param {number} baseDelay 
 * @returns {Promise<any>} 
 * @throws {Error} 
 * @example
 * const result = await retry(
 *   () => fetchData(),
 *   3,
 *   1000
 * );
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    }
    
    throw lastError;
}

/**
 * @param {Function} fn 
 * @param {number} timeoutMs 
 * @returns {Promise<any>} 
 * @throws {Error} 
 * @example
 * const result = await withTimeout(
 *   () => fetchData(),
 *   5000
 * );
 */
async function withTimeout(fn, timeoutMs) {
    return Promise.race([
        fn(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
    ]);
}

/**
 * @param {Array<Function>} tasks 
 * @param {number} concurrency 
 * @returns {Promise<Array>} 
 * @example
 * const results = await batchExecute(
 *   [() => task1(), () => task2(), () => task3()],
 *   2
 * );
 */
async function batchExecute(tasks, concurrency = 5) {
    const results = [];
    const executing = [];
    
    for (const task of tasks) {
        const promise = task().then(result => {
            executing.splice(executing.indexOf(promise), 1);
            return result;
        });
        
        results.push(promise);
        executing.push(promise);
        
        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }
    
    return Promise.all(results);
}

/**

 * @param {Function} fn 
 * @param {number} delay 
 * @returns {Function} 
 * @example
 * const debouncedSave = debounce(saveData, 1000);
 * debouncedSave(); // Will only execute after 1 second of no calls
 */
function debounce(fn, delay) {
    let timeoutId;
    
    return function(...args) {
        clearTimeout(timeoutId);
        
        return new Promise((resolve, reject) => {
            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn.apply(this, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    };
}

/**
 * @param {Function} fn 
 * @param {number} limit 
 * @returns {Function} 
 * @example
 * const throttledUpdate = throttle(updateStatus, 5000);
 * throttledUpdate(); 
 */
function throttle(fn, limit) {
    let inThrottle;
    
    return async function(...args) {
        if (!inThrottle) {
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
            
            return await fn.apply(this, args);
        }
    };
}

module.exports = {
    sleep,
    retry,
    withTimeout,
    batchExecute,
    debounce,
    throttle
};
