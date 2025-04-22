
### Personal Impressions

I truly appreciated the experience of developing a single-page application (SPA). The interface feels seamless and responsive, contributing to a smooth user experience. Additionally, I found Bun to be exceptionally fast and user-friendly, and I definitely plan to use it in future projects.

Using SQLite for data storage was also enjoyable due to its simplicity. However, a noticeable drawback I encountered was the lack of clear error feedback when queries are incorrect. For example, failing to match a column name correctly resulted in no response from the server, which made debugging more difficult.


### Most Challenging Aspect of the Project

One of the most challenging parts was implementing the authentication flow. I chose to use **JWT (JSON Web Tokens)** to secure the application. While I implemented access tokens with a 15-minute expiration time, I am still unsure whether storing the authToken in localStorage is the best practice from a security standpoint.


### Known Issues

In the BitSlow Marketplace, there's a **"Generate Coin"** button (note: this button is only visible if you're logged in and if there is at least one available combination of bits — there are a total of 729 possible combinations). Upon clicking it, a modal appears allowing the user to specify the amount of BitSlow coin to generate, followed by a **"Generate"** button to confirm.

The functionality works as expected; however, after generating a new coin, it will not immediately appear in the Marketplace list. You will need to reload the Marketplace component to see the update.


### Tips for Usage

**Test Account**: You can use the following credentials to log in:

    Email: admin@gmail.com
    Password: admin

**Loading Transactions**: If you encounter the message "No transactions found" upon first loading the page, simply refresh the page once more to ensure all data is properly fetched.

**HTTP requests**: To test and verify the HTTP requests made to the server, I used the **REST Client extension** available in Visual Studio Code. This tool was extremely helpful during development, especially for debugging and validating endpoints.
If you wish to explore the application's behavior or test it yourself, you can find a collection of pre-written requests in the [Open file request.rest](./src/request.rest). You can also add and run your own requests directly from this file using the extension.