# Gonzalo Lara - Stackline Full Stack Assignment

- Search feature
   - API Usage
      - Rather than fetching from the API on every keystroke when a user typing which is inefficient. When searching for a product only search when the user presses Enter or clicks outside of the input box.
      - We also only need to fetch the categories and subcategories once so we can do that in the useEffect that only triggers once on page load.
   - Broken functionality
      - When searching for `Amazon` or selecting `Virtual Currency` on the category it would crash due to the API retireving from `https://images-na.ssl-images-amazon.com/images...` in `next.config.ts` updated hostname to be `*amazon.com` so anything that comes before `amazon.com` will be valid.
         - This way we create a secure establishment ensuring we only view products from `amazon.com` and anything else would not be used.
- Clear Filters Button
   - It was not resetting the categories correctly, when you would click 'Virtual Currency' and then click 'Clear Filters' it would still show 'Virtual Currency' although it was no longer selected.
      - Fixed this logic to always clear the search input, category, and subcategory.

- Checkout feature
   - Implemented a checkout feature that allows a user to add to their cart and then click a checkout button that take them to view all the products that they added to their cart.
      - We resuse the same way it currently displays all products on the page and it is rendered contionally based on clicking on  `Checkout` button.
   - Since it is an eCommerce website and from the response we receive from the API, the product always has a retailPrice property.
      - We can use this for displaying the price on the UI, as it did not show any price details on either the card or the details page.
      - When we enable the capabilites to add to cart, we can use this retailPrice to calculate the total at checkout. 

- Design 
   - Single Product View
      - Rather than having a separate page for displaying the information for a single product, have it be a reusable component.
         - We can have a conditional render for displaying a single product or viewing all products.
      - We eliminate the need to bounce back and forth between pages and stay in a single page; with access to the shopping cart object and all the products loaded from the API that we stored in-memory.
         - Rather than retrieving from the API for every single product view, we can use the information that we store about the product in products that we display and use that as a parameter to pass properties and display.

## Future Improvements (If time was not a constraint)
1. Implemented the secure-checkout page, passing the shoppingCart object to use for invoice and total.
2. capabilities to remove from shopping cart, in product view being able to remove or update the quantity of a product.