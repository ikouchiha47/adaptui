#!/usr/bin/env ts-node
"use strict";
/**
 * Test script to check Google Places API response structure
 * Run: npx ts-node scripts/test-google-places.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
function testGooglePlacesAPI() {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, config, apiKey, searchQuery, searchUrl, searchResponse, searchData, firstPlace, placeId, fields, detailsUrl, detailsResponse, detailsData, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configPath = path.join(__dirname, '../config.json');
                    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    apiKey = config.apiKeys.googlePlaces;
                    if (!apiKey) {
                        console.error('❌ Google Places API key not found in config.json');
                        process.exit(1);
                    }
                    console.log('✅ API key loaded');
                    console.log('');
                    // Test 1: Text Search
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('TEST 1: Text Search - "fun bars in Bangkok"');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    searchQuery = 'fun bars in Bangkok';
                    searchUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=".concat(encodeURIComponent(searchQuery), "&key=").concat(apiKey);
                    return [4 /*yield*/, fetch(searchUrl)];
                case 1:
                    searchResponse = _a.sent();
                    return [4 /*yield*/, searchResponse.json()];
                case 2:
                    searchData = _a.sent();
                    if (searchData.status !== 'OK') {
                        console.error('❌ Search failed:', searchData.status);
                        console.error('Error:', searchData.error_message);
                        process.exit(1);
                    }
                    console.log("\u2705 Found ".concat(searchData.results.length, " results"));
                    console.log('');
                    if (searchData.results.length === 0) {
                        console.log('No results found');
                        process.exit(0);
                    }
                    firstPlace = searchData.results[0];
                    console.log('First result:');
                    console.log('  Name:', firstPlace.name);
                    console.log('  Place ID:', firstPlace.place_id);
                    console.log('  Address:', firstPlace.formatted_address);
                    console.log('  Rating:', firstPlace.rating);
                    console.log('');
                    // Test 2: Place Details (with all fields)
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('TEST 2: Place Details - Full Response');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    placeId = firstPlace.place_id;
                    fields = [
                        'name',
                        'formatted_address',
                        'geometry',
                        'rating',
                        'opening_hours',
                        'photos',
                        'reviews',
                        'user_ratings_total',
                        'price_level',
                        'types',
                        'website',
                        'formatted_phone_number',
                        'current_opening_hours',
                        'business_status'
                    ].join(',');
                    detailsUrl = "https://maps.googleapis.com/maps/api/place/details/json?place_id=".concat(placeId, "&fields=").concat(fields, "&key=").concat(apiKey);
                    return [4 /*yield*/, fetch(detailsUrl)];
                case 3:
                    detailsResponse = _a.sent();
                    return [4 /*yield*/, detailsResponse.json()];
                case 4:
                    detailsData = _a.sent();
                    if (detailsData.status !== 'OK') {
                        console.error('❌ Details failed:', detailsData.status);
                        console.error('Error:', detailsData.error_message);
                        process.exit(1);
                    }
                    console.log('✅ Place details retrieved');
                    console.log('');
                    console.log('Full response:');
                    console.log(JSON.stringify(detailsData.result, null, 2));
                    console.log('');
                    // Check for popular times
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('POPULAR TIMES CHECK');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    result = detailsData.result;
                    if (result.current_opening_hours) {
                        console.log('✅ current_opening_hours found:');
                        console.log(JSON.stringify(result.current_opening_hours, null, 2));
                    }
                    else {
                        console.log('❌ current_opening_hours NOT available');
                    }
                    console.log('');
                    if (result.opening_hours) {
                        console.log('✅ opening_hours found:');
                        console.log(JSON.stringify(result.opening_hours, null, 2));
                    }
                    else {
                        console.log('❌ opening_hours NOT available');
                    }
                    console.log('');
                    // Note about popular times
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('IMPORTANT NOTE');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('');
                    console.log('Google Places API does NOT provide popular times data via the official API.');
                    console.log('Popular times are only visible in Google Maps UI.');
                    console.log('');
                    console.log('Alternatives:');
                    console.log('1. Use a third-party scraper (against ToS)');
                    console.log('2. Use user_ratings_total as a proxy for popularity');
                    console.log('3. Use review count and rating to estimate crowd levels');
                    console.log('4. Generate mock data based on time of day and place type');
                    console.log('');
                    console.log('Current approach: Using mock data with randomization');
                    return [2 /*return*/];
            }
        });
    });
}
testGooglePlacesAPI().catch(console.error);
