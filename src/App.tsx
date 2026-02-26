import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { PackageView } from './pages/PackageView';
import { getRegistryStatus } from './services/api';

function App() {
    const [registryOnline, setRegistryOnline] = useState<boolean | null>(null);

    useEffect(() => {
        getRegistryStatus()
            .then((s) => setRegistryOnline(s.status === 'ONLINE'))
            .catch(() => setRegistryOnline(false));
    }, []);

    return (
        <BrowserRouter>
            <div className="app-layout">
                <Navbar registryOnline={registryOnline} />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/package/:name" element={<PackageView />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
