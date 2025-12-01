import React from 'react';
import { Link } from 'react-router-dom';
import { FaLongArrowAltRight, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './HeroSection';

/**
 * This is a temporary component to show how to update the hero section carousel
 * Replace the image URL in Home.jsx with the URL shown below
 */
const UpdatedHeroContent = () => {
  return (
    <HeroSection 
      slides={[
        {
          id: 1,
          title: "Connecting you to China's best products to revolutionise your business",
          description: "Discover the diverse range of store fronts under Sinosply, offering unique and exclusive products tailored to your needs.",
          linkTo: "/quote",
          linkText: "Request any product today",
          bgImage: "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
        },
        {
          id: 2,
          title: "Seamless Connections to China's Top Suppliers",
          description: "Access our curated network of over 2,000 trusted Chinese manufacturers with direct factory prices.",
          linkTo: "/products",
          linkText: "Explore our products",
          // Replace the second slide image with this URL in Home.jsx
          bgImage: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
        },
        {
          id: 3,
          title: "Sustainable Sourcing for a Greener Future",
          description: "Choose from a range of sustainable and eco-friendly products with green certifications.",
          linkTo: "/quote",
          linkText: "Get a free quote",
          bgImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"
        }
      ]}
    />
  );
};

export default UpdatedHeroContent; 