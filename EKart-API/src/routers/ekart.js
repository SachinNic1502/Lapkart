const { LocalStorage } = require("node-localstorage");
const express = require("express");
const User = require("../models/User");
const Address = require("../models/UserAddress");
  const router = express.Router();
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const Category = require('../models/Category');
const Product = require("../models/Product");
const localStorage = new LocalStorage("./scratch");
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Payment = require("../models/Payment");
const jwt = require('jsonwebtoken');

router.post("/signup", async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            addresses,
            phoneNumber,
            dateOfBirth,
            gender,
            newsletterSubscription,
            profilePicture,
        } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // if (!addresses || !addresses.length) {
        //     return res.status(400).json({ message: "Addresses are required" });
        // }
        // const addressIds = [];
        // for (const address of addresses) {
        //     const { street, city, state, zipCode } = address;
        //     const newAddress = new Address({
        //         street,
        //         city,
        //         state,
        //         zipCode,
        //     });

        //     const savedAddress = await newAddress.save();
        //     addressIds.push(savedAddress._id);
        // }

        // Create a new User with the array of address IDs
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            // addresses: addressIds, // Store the array of address IDs in the user document
            phoneNumber,
            dateOfBirth,
            gender,
            newsletterSubscription,
            profilePicture,
        });

        // Save the User entry
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/update-user/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;

      const {
          username,
          email,
          password,
          firstName,
          lastName,
          addresses,
          phoneNumber,
          dateOfBirth,
          gender,
          newsletterSubscription,
          profilePicture,
      } = req.body;

      const existingUser = await User.findById(userId);

      if (!existingUser) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update user fields
      existingUser.username = username || existingUser.username;
      existingUser.email = email || existingUser.email;
      existingUser.password = password ? await bcrypt.hash(password, 10) : existingUser.password;
      existingUser.firstName = firstName || existingUser.firstName;
      existingUser.lastName = lastName || existingUser.lastName;
      existingUser.phoneNumber = phoneNumber || existingUser.phoneNumber;
      existingUser.dateOfBirth = dateOfBirth || existingUser.dateOfBirth;
      existingUser.gender = gender || existingUser.gender;
      existingUser.newsletterSubscription = newsletterSubscription || existingUser.newsletterSubscription;
      existingUser.profilePicture = profilePicture || existingUser.profilePicture;

      // Update addresses
      if (addresses && addresses.length > 0) {
          const addressIds = [];
          for (const address of addresses) {
              const { street, city, state, zipCode } = address;

              // If the address has an ID, update the existing address
              if (address._id) {
                  const updatedAddress = await Address.findByIdAndUpdate(
                      address._id,
                      { street, city, state, zipCode },
                      { new: true } // Return the updated document
                  );
                  addressIds.push(updatedAddress._id);
              } else {
                  // If the address doesn't have an ID, create a new address
                  const newAddress = new Address({ street, city, state, zipCode });
                  const savedAddress = await newAddress.save();
                  addressIds.push(savedAddress._id);
              }
          }

          existingUser.addresses = addressIds;
      }

      // Save the updated User entry
      await existingUser.save();

      res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log(email);
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // console.log('Hashed Password from Database:', user.password);
//     // console.log('Plaintext Password from Request:', password);

//     // Compare the hashed password from the database with the plaintext password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     console.log("Manual Comparison Result:", isPasswordValid);

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     res.status(200).json({ message: "Login successful" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check if the provided identifier is an email or a phone number
    let isEmail = false;
    let isPhoneNumber = false;

    // Check if the identifier is an email
    if (/^\S+@\S+\.\S+$/.test(identifier)) {
      isEmail = true;
    }

    // Check if the identifier is a phone number
    if (/^\d{10}$/.test(identifier)) {
      isPhoneNumber = true;
    }

    // If neither email nor phone number, return an error
    if (!isEmail && !isPhoneNumber) {
      return res.status(400).json({ message: "Invalid email or phone number" });
    }

    // Choose the field to query based on the type of identifier provided
    const fieldToQuery = isEmail ? 'email' : 'phoneNumber';
    const user = await User.findOne({ [fieldToQuery]: identifier });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the hashed password from the database with the plaintext password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // If authentication is successful, create a JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//opt Send
router.post("/login/request-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    console.log("Received phoneNumber:", phoneNumber);
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.log(user);
      return res.status(404).json({ message: "User not found" });
    }
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });
    console.log(otp);
    localStorage.setItem("otp", otp);
    localStorage.setItem("otpExpiration", Date.now() + 2 * 60 * 1000); // Set OTP expiration time to 30 seconds
    console.log("Stored OTP:", otp);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    // Retrieve OTP and its expiration time from the local storage
    const storedOtp = localStorage.getItem("otp");
    const storedOtpExpiration = localStorage.getItem("otpExpiration");

    console.log("Retrieved OTP from local storage:", storedOtp);

    if (!storedOtp || storedOtpExpiration < Date.now()) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
      localStorage.removeItem("otp");
      localStorage.removeItem("otpExpiration");
    }

    if (storedOtp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Clear the stored OTP after successful verification
    // localStorage.removeItem('otp');
    // localStorage.removeItem('otpExpiration');

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post('/user/:userId/add-address', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { street, city, state, zipCode } = req.body;
        const newAddress = new Address({
            street,
            city,
            state,
            zipCode,
        });
        const savedAddress = await newAddress.save();
        user.addresses.push(savedAddress._id);
        await user.save();

        res.status(200).json({ message: 'Address added to the user successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post('/create-category', async (req, res) => {
    try {
      const { categoryName } = req.body;
  
      // Create a new category
      const newCategory = new Category({ categoryName });
      const savedCategory = await newCategory.save();
  
      res.status(201).json(savedCategory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  router.post('/product', async (req, res) => {
    try {
      const { category ,...productData } = req.body;
  
      // Check if the category exists
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(400).json({ message: 'Category not found' });
      }
  
      const newProduct = new Product({
        ...productData,
        category: existingCategory._id,
      });
  
      const savedProduct = await newProduct.save();
      res.status(201).json("Product added");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Get all products
router.get('/products', async (req, res) => {
    try {
      const products = await Product.find().populate('category');
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Get a single product by ID
  router.get('/product/:productId', async (req, res) => {
    try {
      const productId = req.params.productId;
      console.log(productId);
      const product = await Product.findById(productId).populate('category');
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.post('/add-to-cart', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        // Check if the product exists
        const product = await Product.findById(productId);
        console.log(product);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the user has a cart
        let userCart = await Cart.findOne({ customer: userId });

        if (!userCart) {
            // If the user doesn't have a cart, create a new one
            const newCart = new Cart({
                customer: userId,
                items: [{
                    product: productId,
                    quantity: quantity,
                    price: product.price,
                    totalPrice: quantity * product.price,
                }],
            });

            userCart = await newCart.save();
        } else {
            // If the user already has a cart, check if the product is already in the cart
            const existingItemIndex = userCart.items.findIndex(item => item.product.toString() === productId);

            if (existingItemIndex !== -1) {
                // If the product is already in the cart, update the quantity
                userCart.items[existingItemIndex].quantity += quantity;
            } else {
                // If the product is not in the cart, add it as a new item
                userCart.items.push({
                    product: productId,
                    quantity: quantity,
                    price: product.price,
                    totalPrice: quantity * product.price,
                });
            }

            userCart = await userCart.save();
        }

        res.status(201).json({ message: 'Item added to cart successfully', cart: userCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

  router.get('/view-cart/:userId', async (req, res) => {
    const userId = req.params.userId;
  
    try {
      // Retrieve the user's cart
      const userCart = await Cart.findOne({ customer: userId }).populate('customer').populate('items.product');
  
      if (!userCart) {
        return res.status(404).json({ message: 'Cart not found for the user' });
      }
  
      // Map cart items to a format suitable for response
      const formattedCartItems = await Promise.all(userCart.items.map(async item => {
        const product = await Product.findById(item.product);
  
        if (product) {
          // Update the price and total price based on the current product details
          item.price = product.price;
          item.totalPrice = item.quantity * product.price;
  
          return {
            productId: item.product._id,
            productName: product.productName,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
          };
        }
      }));
  
      // Filter out items with missing product details
      const validCartItems = formattedCartItems.filter(item => item);
  
      // Calculate total cart price
      const totalCartPrice = validCartItems.reduce((total, item) => total + item.totalPrice, 0);
  
      res.status(200).json({ cartItems: validCartItems, totalCartPrice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  router.delete('/remove-from-cart/:userId/:productId', async (req, res) => {
    const userId = req.params.userId;
    const productId = req.params.productId;
  
    try {
      // Find the user's cart
      const userCart = await Cart.findOne({ customer: userId });
        
      if (!userCart) {
        console.log('Cart not found for user:', userId);
        return res.status(404).json({ message: 'Cart not found for the user' });
      }
  
      // Find the index of the item to remove
      const itemIndex = userCart.items.findIndex(item => item.product.toString() === productId);
  
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Product not found in the cart' });
      }
  
      // Remove the item from the cart
      userCart.items.splice(itemIndex, 1);
  
      // Save the updated cart
      const updatedCart = await userCart.save();
  
      res.status(200).json({ message: 'Product removed from the cart successfully', cart: updatedCart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  const razorpay = new Razorpay({
    key_id: 'rzp_test_JYuRCTm6mOmvN3',
    key_secret: 'ko7XZFqYosMOUNOcV0spiFCn',
  });
  
  router.post('/create-order', async (req, res) => {
    try {
      const { userId } = req.body; // Assuming userId is sent in the request body
  
      const options = {
        amount: 50000,
        currency: 'INR',
        receipt: 'order_receipt_123',
        payment_capture: 1,
      };
  
      const order = await razorpay.orders.create(options);
  
      // Store payment information in the database
      const newPayment = new Payment({
        user: userId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: 'your_payment_id', // Replace with the actual payment ID from Razorpay
      });
  
      await newPayment.save();
  
      res.json({ order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.post('/order', async (req, res) => {
    try {
      const { userId, cartItemIds, paymentId } = req.body;
      console.log(userId);
      console.log(cartItemIds);
      console.log(paymentId);
      // Fetch cart details based on the provided cartItemIds
      const cartItems = await Cart.find({ user: userId, _id: { $in: cartItemIds } });
      console.log(cartItems);
      if (!cartItems || cartItems.length === 0) {
        console.log(cartItems);
        return res.status(404).json({ message: 'No matching cart items found' });
      }
  
      // Create an order
      const newOrder = new Order({
        user: userId,
        products: cartItems.map(item => item.product),
        payment: paymentId,
      });
  
      // Save the order
      const savedOrder = await newOrder.save();
  
      // Remove items from the cart
      for (const cartItem of cartItems) {
        const deletionResult = await Cart.deleteOne({ user: userId, _id: cartItem._id });
  
        if (deletionResult.deletedCount === 1) {
          console.log(`CartItem with ID ${cartItem._id} deleted successfully.`);
        } else {
          console.log(`CartItem with ID ${cartItem._id} not found.`);
        }
      }
  
      res.status(201).json({ message: 'Order placed successfully', orderId: savedOrder._id });
    } catch (error) {
      console.error('Order API error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
 
  
  

module.exports = router;
