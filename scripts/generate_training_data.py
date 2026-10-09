"""Generate the labelled transaction-description dataset used to train the ML expense classifier.

Real bank / UPI statements describe the same merchant in many noisy ways
("SWIGGY*ORDER 8812", "UPI/zomato@hdfc/Payment", "POS 4411 DMART MUMBAI"). We take a list of
Indian merchants and generic phrases per category and render them through statement-style
templates, so the classifier learns from text that looks like what users actually upload.

Usage:  python scripts/generate_training_data.py
Output: backend/data/training_transactions.csv  (description,category)
"""
import csv
import random
from pathlib import Path

random.seed(42)

MERCHANTS = {
    "Food": ["Swiggy", "Zomato", "Dominos", "Pizza Hut", "McDonalds", "KFC", "Burger King", "Starbucks", "Cafe Coffee Day",
             "Chaayos", "Haldirams", "Blinkit", "Zepto", "BigBasket", "DMart", "Reliance Fresh", "More Supermarket",
             "Nature Basket", "Barbeque Nation", "Subway", "Faasos", "Behrouz Biryani", "Theobroma", "Amul Parlour"],
    "Transport": ["Uber", "Ola", "Rapido", "Indian Oil", "HP Petrol Pump", "Bharat Petroleum", "Shell Fuel", "Delhi Metro",
                  "Namma Metro", "BMTC Bus", "IRCTC", "IndiGo", "Air India", "RedBus", "FASTag Toll", "Parking Charges",
                  "Yulu", "Blu Smart", "Meru Cabs", "Auto Rickshaw"],
    "Shopping": ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa", "Meesho", "Tata Cliq", "Croma", "Reliance Digital",
                 "Decathlon", "Lifestyle", "Westside", "Zara", "H&M", "IKEA", "Lenskart", "Titan Watches", "Shoppers Stop",
                 "Pantaloons", "Bata Shoes"],
    "Entertainment": ["Netflix", "Spotify", "Amazon Prime Video", "Disney Hotstar", "BookMyShow", "PVR Cinemas", "INOX",
                      "Sony LIV", "YouTube Premium", "Steam Games", "PlayStation Store", "JioCinema", "Zee5", "Gaana",
                      "Wonderla", "Smaaash", "Hard Rock Cafe Pub", "Social Bar", "Concert Tickets", "Insider Events"],
    "Bills": ["House Rent", "Electricity Bill BESCOM", "Tata Power", "Adani Electricity", "Water Board", "Airtel Postpaid",
              "Jio Recharge", "Vi Prepaid", "ACT Fibernet", "Airtel Xstream Broadband", "Tata Play DTH", "Indane Gas",
              "Mahanagar Gas", "LIC Premium", "HDFC Ergo Insurance", "Home Loan EMI", "Car Loan EMI", "Society Maintenance",
              "Credit Card Bill", "Piped Gas Bill"],
    "Healthcare": ["Apollo Pharmacy", "MedPlus", "PharmEasy", "1mg", "Netmeds", "Practo Consultation", "Fortis Hospital",
                   "Manipal Hospital", "Dr Lal PathLabs", "Thyrocare", "Cult Fit Gym", "Dental Clinic", "Eye Clinic",
                   "Max Healthcare", "Cloudnine Hospital", "Aster Clinic"],
    "Education": ["Udemy", "Coursera", "Unacademy", "Byjus", "upGrad", "Simplilearn", "Vedantu", "College Fees",
                  "School Fees", "Tuition Classes", "Amazon Kindle Books", "Sapna Book House", "Exam Registration",
                  "NPTEL Certification", "Duolingo Plus", "Scaler Academy"],
    "Investments": ["Zerodha", "Groww", "SIP HDFC Mutual Fund", "SIP SBI Mutual Fund", "Kuvera", "Upstox", "PPF Deposit",
                    "Fixed Deposit", "NPS Contribution", "ICICI Prudential MF", "Smallcase", "Coin by Zerodha",
                    "Sovereign Gold Bond", "Recurring Deposit"],
    "Others": ["ATM Cash Withdrawal", "Transfer to Friend", "Gift for Mom", "Donation Temple", "Salon Haircut",
               "Laundry Service", "Courier Charges", "Bank Charges", "Pet Care", "Urban Company Cleaning",
               "Tailor", "Charity NGO", "Misc Payment", "Wedding Gift", "Locksmith"],
}

GENERIC = {
    "Food": ["lunch with team", "dinner outside", "groceries", "vegetables and fruits", "milk and bread", "food delivery",
             "restaurant bill", "street food", "coffee", "snacks", "tea stall", "bakery"],
    "Transport": ["cab ride", "petrol refill", "diesel", "train ticket", "bus pass", "flight ticket", "metro card recharge",
                  "car service", "bike service", "toll charges"],
    "Shopping": ["new shoes", "clothes", "electronics purchase", "mobile phone", "headphones", "furniture",
                 "home decor", "kitchen items", "laptop bag", "luxury watch"],
    "Entertainment": ["movie tickets", "streaming subscription", "music subscription", "video games", "night out",
                      "amusement park", "concert", "comedy show"],
    "Bills": ["monthly rent", "electricity bill", "water bill", "internet bill", "mobile recharge", "gas cylinder",
              "insurance premium", "loan emi", "maintenance charges", "broadband bill"],
    "Healthcare": ["medicines", "doctor consultation", "blood test", "hospital bill", "gym membership", "physiotherapy",
                   "health checkup", "dentist"],
    "Education": ["online course", "textbooks", "semester fees", "coaching classes", "certification exam", "workshop fee"],
    "Investments": ["monthly sip", "mutual fund investment", "stock purchase", "gold investment", "fd deposit"],
    "Others": ["cash withdrawal", "sent money", "miscellaneous", "gift", "donation", "haircut", "service charge"],
}

TEMPLATES = [
    "{m}", "{m}", "{M}", "{m} payment", "UPI/{l}@okaxis/Payment", "UPI-{M}-{n}", "POS {n} {M} {city}",
    "{M}*ORDER {n}", "{m} order #{n}", "NEFT {M} {n}", "{m} {city}", "Paid to {m}", "{l} txn {n}", "IMPS/{M}/{n}",
]
CITIES = ["MUMBAI", "BANGALORE", "DELHI", "PUNE", "HYDERABAD", "CHENNAI", "KOLKATA"]


def render(name: str) -> str:
    template = random.choice(TEMPLATES)
    return template.format(m=name, M=name.upper(), l=name.lower().replace(" ", ""),
                           n=random.randint(1000, 99999), city=random.choice(CITIES))


def main():
    rows = []
    for category, names in MERCHANTS.items():
        for name in names:
            for _ in range(4):
                rows.append((render(name), category))
    for category, phrases in GENERIC.items():
        for phrase in phrases:
            rows.append((phrase, category))
            rows.append((phrase.title(), category))
    random.shuffle(rows)

    out = Path(__file__).resolve().parent.parent / "backend" / "data" / "training_transactions.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["description", "category"])
        writer.writerows(rows)
    print(f"Wrote {len(rows)} labelled descriptions to {out}")


if __name__ == "__main__":
    main()
