[comment]: 2019-11-10

# Timer Management in JavaScript for Polling Web Apps

Polling is a very simple technique to get periodically data from a server, e.g. a REST API. There are more efficient techniques like long polling or web sockets, but simple polling is easy to use and there are no special server settings required.

Anyway, polling says: 'Request server data every x seconds'. So where do we need to think about the timer management? JavaScript's `setInterval` seems to be perfect for this purpose:

```javascript
// Call 'getApiData' every 30 seconds
window.setInterval(getApiData , 30000);
```

This is actually not a good approach because the execution time of the function is unknown. The network may be slow and the server response may take 40 seconds to be received. Undeterred, however, the client sends another request after 30 seconds. The network is now even busier. And so on.

![Example: When using setInterval, the responses occur irregularly and in the wrong order.](../img/setinterval.png)
![Legend of the diagram](../img/timeout_desc.png)

Here it makes more sense to wait 30 seconds between response and request. It does not matter how long it takes for the server to respond.

![Same example with 'setTimeout': Now the responses are better distributed over time](../img/settimeout.png)

Now the responses are better distributed over time. The implementation is a bit more complicated:

```javascript
const getApiData = async () => {
  // Wait for HTTP response
  const apiData = await httpRequest();

  // Set timer
  window.setTimeout(getApiData, 30000);
};

// Initial call
getApiData();
```

I use fancy ECMAScript 2017 syntax with async/await to keep the example short and concise. It's also possible to build it with promises or callback functions.

Let's extend the example to be more realistic. Remember that every `await` can throw an error. An error can have many reasons:
- The server is too busy and does not respond within a particular time (timeout)
- The client has temporarily no internet connection
- The browser aborts the request
- ...

An Error has to be caught:

```javascript
const getApiData = async () => {
  try {
    // Wait for HTTP response
    const apiData = await httpRequest();
  } catch (e) { }
  // Set timer
  window.setTimeout(getApiData, 30000);
};

// Initial call
getApiData();
```

Looks better, but it's not good enough yet. Let's take another look at the error case: Once an error occurs, it will take another 30 seconds for another attempt to be made. That's way too long. You can set the timer inside at the end of the try block and another one inside the catch block. The last one should execute much faster. Here is the code:

```javascript
const getApiData = async () => {
  try {
    // Wait for HTTP response
    const apiData = await httpRequest();

    // Set timer
    window.setTimeout(getApiData, 30000);
  } catch (e) {
    // Try again
    window.setTimeout(getApiData, 2000);
  }
};

// Initial call
getApiData();
```

But why shouldn't we call the `getApiData` function immediately inside the catch block without any timer? There are a few reasons:
- If the error occurs immediately (e.g. if the user is temporarily not connected to the internet or there is a systematic error), it will be tried again immediately. The error comes again immediately, etc. This process causes performance problems.
- The cause of an error is often a temporary effect caused by external influences. Time has to pass before the cause of the problem is resolved. That's why it makes no sense to try it again immediately.
- The direct self-call creates a recursion, which could also lead to performance problems.

Finally, let's assume we have a refresh button. The user should have the option to update the API data manually. After the user refreshes the API data, the automatic refresh should be reset and wait another 30 seconds. `clearTimeout` does the reset here. For this purpose, it is necessary to save the timer ID, which the function returns.

Here is the final code:

```javascript
let timerId = null;

const getApiData = async () => {
  // Clear timer first
  window.clearTimeout(timerId);

  try {
    // Wait for HTTP response
    const apiData = await httpRequest();

    // Set timer
    timerId = window.setTimeout(getApiData, 30000);
  } catch (e) {
    // Try again
    timerId = window.setTimeout(getApiData, 2000);
  }
};

// Refresh button pressed by user
myButton.addEventListener('click', getApiData);

// Initial call
getApiData();
```

As you can see, the code has become more extensive than you might have thought. A simple `setInterval` is no longer sufficient for this comparatively simple use case.

If you imagine your app has not just one, but multiple timers, it gets confusing very quickly. For this purpose, I created a tiny timer library: [https://github.com/cd/interval-handler](https://github.com/cd/interval-handler)