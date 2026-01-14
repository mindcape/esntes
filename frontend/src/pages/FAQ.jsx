import React from 'react';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <span>{question}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && <div style={{ marginTop: '0.5rem', color: '#555', lineHeight: '1.6' }}>{answer}</div>}
        </div>
    );
};

export default function FAQ() {
    return (
        <div className="container">
            <h2 style={{ marginBottom: '2rem' }}>Frequently Asked Questions</h2>
            <div className="card">
                <FAQItem
                    question="How do I submit a maintenance request?"
                    answer="Navigate to the 'Dashboard' or 'Open Requests' card, click 'Open Requests' and then 'New Request'. Fill in the details and submit."
                />
                <FAQItem
                    question="How can I pay my HOA dues?"
                    answer="Go to the 'Ledger' page (or 'Current Balance' card). Click the 'Pay Now' button to initiate a secure payment."
                />
                <FAQItem
                    question="Where can I find the gate code?"
                    answer="Visit the 'Visitor Access' page. You can register a guest to get a temporary code, or view your personal code if assigned."
                />
                <FAQItem
                    question="How do I contact the Board?"
                    answer="You can find Board Member contact information in the 'Directory' or under 'Help > HOA Support'."
                />
                <FAQItem
                    question="What if I have a technical issue with this app?"
                    answer="Please visit the 'Help > Tech Support' page to contact the application support team."
                />
            </div>
        </div>
    );
}
