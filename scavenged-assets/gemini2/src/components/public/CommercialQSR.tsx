import React from 'react';

const CommercialQSR: React.FC = () => {
    return (
        <div style={{
            backgroundColor: '#1A1A1D',
            color: '#FFD700',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
        }}>
            <h1>90-Day Turnkey QSR Build</h1>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Innovative Solutions for Your QSR Needs</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                <div>
                    <h2>Mass Earthworks</h2>
                    <p>Expertise in large-scale earth moving and site preparation.</p>
                </div>
                <div>
                    <h2>Heavy Concrete</h2>
                    <p>Durable solutions for all your concrete needs.</p>
                </div>
                <div>
                    <h2>96% Marshall Paving</h2>
                    <p>Top-quality paving for efficiency and longevity.</p>
                </div>
                <div>
                    <h2>Total Envelope (Roof/HVAC)</h2>
                    <p>Comprehensive solutions for roofing and HVAC.</p>
                </div>
            </div>
        </div>
    );
};

export default CommercialQSR;
