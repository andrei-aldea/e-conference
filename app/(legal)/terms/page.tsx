import { PageTitle } from '@/components/layout/page-header'

export default function TermsPage() {
	return (
		<main className='container mx-auto p-8'>
			<PageTitle className='mb-4 text-3xl font-bold'>Terms of Service</PageTitle>
			<div className='space-y-4'>
				<p>Welcome to eConference!</p>
				<p>
					These terms and conditions outline the rules and regulations for the use of eConference&apos;s Website,
					located at our domain.
				</p>
				<p>
					By accessing this website we assume you accept these terms and conditions. Do not continue to use eConference
					if you do not agree to take all of the terms and conditions stated on this page.
				</p>
				<h2 className='mt-6 text-2xl font-semibold'>1. Introduction</h2>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quia debitis iste molestiae eos reiciendis deserunt,
					veritatis, natus rerum perferendis repellendus in quibusdam voluptatum odit quisquam veniam, sint nisi cumque.
					Nobis!
				</p>
				<h2 className='mt-6 text-2xl font-semibold'>2. Intellectual Property Rights</h2>
				<p>
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam necessitatibus doloribus dolore voluptatem
					dolorum at quidem nisi, commodi molestiae explicabo ducimus consectetur natus! Magnam, minus dicta? Harum
					similique repellendus voluptate?
				</p>
			</div>
		</main>
	)
}
