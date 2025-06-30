Overview
This is a custom Shopify theme featuring:

Product page enhancements

Scientific breakdown section

Custom recommendations system

Tiered cart functionality

Key Components
1. Theme Sections
main-product.liquid
Enhanced product display with:

Custom image badges

Video demonstration support

Adjustable padding

usp-section.liquid
Displays 3 key selling points:

Natural ingredients

Dermatologist tested

Visible results in 7 days

Customizable SVG icons and text

scientific-breakdown.liquid
Data table showing:

Skincare steps

Key ingredients

Scientific benefits

Multiple display styles (minimal, bordered, striped)

custom-recommendations.liquid
Displays personalized product recommendations

Pulls data from app proxy endpoint

2. JavaScript Features
Tiered Cart System
Automatic discount tiers:

₹10,000 → 5% off

₹20,000 → 10% off

₹30,000 → 15% off

Visual progress bar

Real-time cart updates

Implementation Notes
Assumptions
Products have "clinical-grade" tag for scientific breakdown

Recommendation data comes from mock API endpoint

Store uses Us dollar ($) currency

Architecture Decisions
Modular Components: Each section is self-contained

Progressive Enhancement: Core functionality works without JavaScript

Mobile-First: Responsive design for all sections

Mocked/Simulated Features
Recommendation data is hardcoded (would connect to real API in production)

Cart discount tiers are predefined

Scientific data is sample content

Installation
Add files to Shopify theme editor

Add sections to appropriate templates

For cart functionality, include cart-discount.js

Customization
Edit these settings in theme editor:

Section padding

Color schemes

USP content

Scientific data tables
